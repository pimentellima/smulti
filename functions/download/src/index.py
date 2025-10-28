import os
import json
import boto3
import psycopg2
import requests
from yt_dlp import YoutubeDL
from io import BytesIO

s3 = boto3.client('s3')
S3_BUCKET = os.environ['S3_BUCKET']

def get_db_connection():
    return psycopg2.connect(
        host=os.environ['DB_HOST'],
        dbname=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASS'],
    )

def update_format_status(conn, format_id, status, download_url=None):
    with conn.cursor() as cur:
        if download_url:
            cur.execute("""
                UPDATE formats
                SET status = %s, "downloadUrl" = %s
                WHERE id = %s
            """, (status, download_url, format_id))
        else:
            cur.execute("""
                UPDATE formats
                SET status = %s
                WHERE id = %s
            """, (status, format_id))
    conn.commit()
    
def download_and_upload(format_data):
    format_id = format_data['id']
    video_url = format_data['url']  

    print(f'Baixando vídeo {video_url} (formatId={format_id})')

    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'outtmpl': '-',
        'quiet': True,
        'merge_output_format': 'mp4',
        'retries': 3,
    }

    with YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(video_url, download=False)
        download_stream_url = result.get('url')

    response = requests.get(download_stream_url, stream=True)
    response.raise_for_status()

    key = f'downloads/{format_id}.mp4'
    s3.upload_fileobj(response.raw, S3_BUCKET, key, ExtraArgs={'ContentType': 'video/mp4'})

    return f'https://{S3_BUCKET}.s3.amazonaws.com/{key}'

def handler(event, context):
    conn = get_db_connection()

    for record in event['Records']:
        body = json.loads(record['body'])
        format_id = body.get('formatId')

        try:
            with conn.cursor() as cur:
                cur.execute('SELECT id, url FROM formats WHERE id = %s', (format_id,))
                row = cur.fetchone()

            if not row:
                print(f'❌ Format {format_id} não encontrado')
                continue

            format_data = {'id': row[0], 'url': row[1]}

            update_format_status(conn, format_id, 'downloading')

            try:
                download_url = download_and_upload(format_data)
                update_format_status(conn, format_id, 'finished-downloading', download_url)
                print(f'✅ Download concluído: {download_url}')

            except Exception as e:
                print(f'❌ Erro ao baixar/upload {format_id}: {e}')
                update_format_status(conn, format_id, 'error-downloading')

        except Exception as e:
            print(f'Erro geral no processamento do formatId={format_id}: {e}')
            update_format_status(conn, format_id, 'error-downloading')

    conn.close()