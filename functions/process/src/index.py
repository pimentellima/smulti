import os
import yt_dlp 
import psycopg2
from psycopg2.extras import DictCursor
import shutil
import boto3
import time

BASE_DIR = os.path.dirname(__file__)
COOKIE_PATH = os.path.join(BASE_DIR, "cookies.txt")

TMP_COOKIE_PATH = "/tmp/cookies.txt"
if not os.path.exists(TMP_COOKIE_PATH):
    try:
        shutil.copy(COOKIE_PATH, TMP_COOKIE_PATH)
    except Exception as e:
        print(f"Erro ao copiar cookies.txt: {e}")

ydl_opts = {
    'cookiefile': TMP_COOKIE_PATH, 
    'extractor_args': {'youtube': {'player_client': 'all'}},
    'no_warnings': True,   
}

def extract_job_info(video_url):
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)

    print(len(info.get("formats", [])), "formatos extraídos para o vídeo:", video_url)
    formats = []

    for f in info.get("formats", []):
        filesize_bytes = f.get("filesize")
        formats.append({
            "format_id": f.get("format_id"),
            "url": f.get("url"),
            "ext": f.get("ext"),
            "filesize": round(filesize_bytes / (1024 * 1024), 2) if filesize_bytes else None,
            "acodec": f.get("acodec"),
            "vcodec": f.get("vcodec"),
            "language": f.get("language"),
            "format_note": f.get("format_note"),
            "tbr": str(f.get("tbr")) if f.get("tbr") else None,
            "resolution": f"{f.get('width')}x{f.get('height')}" if f.get("width") and f.get("height") else None,
        })

    return {
        "title": info.get("title"),
        "thumbnail": info.get("thumbnail"),
        "url": video_url,
        "formats": formats
    }

def process_job(job_id, db_connection_string):
    conn = None
    try:
        print("Versão do yt-dlp:", yt_dlp.version.__version__)
        conn = psycopg2.connect(db_connection_string)
        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute("SELECT * FROM jobs WHERE id = %s", (job_id,))
            job = cur.fetchone()
            
            if not job:
                print(f"Job ID {job_id} não encontrado no banco de dados")
                return
            
            cur.execute("UPDATE jobs SET status = %s WHERE id = %s", ('processing', job_id))
            conn.commit()
                    
            video_url = job["url"]
            job_data = extract_job_info(video_url)
            
            cur.execute(
                "UPDATE jobs SET title = %s, status = %s, thumbnail = %s WHERE id = %s",
                (job_data["title"], 'finished-processing', job_data["thumbnail"], job_id)
            )
            
            for format_data in job_data["formats"]:
                cur.execute("""
                    INSERT INTO formats (
                        format_id, job_id, ext, resolution, acodec, vcodec, 
                        filesize, tbr, url, language, format_note
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    format_data["format_id"],
                    job_id,
                    format_data["ext"],
                    format_data["resolution"],
                    format_data["acodec"],
                    format_data["vcodec"],
                    format_data["filesize"],
                    format_data["tbr"],
                    format_data["url"],
                    format_data["language"],
                    format_data["format_note"]
                ))
        conn.commit()
        print(f"Job {job_id} processado com sucesso. Título: {job_data['title']}")
        
    except Exception as e:
        print("Erro ao processar job:", e)
        try:
            if conn is not None and not conn.closed:
                cur = conn.cursor()
                cur.execute("UPDATE jobs SET status = %s WHERE id = %s", ('error-processing', job_id))
                conn.commit()
                print(f"Job atualizado com status de erro. ID: {job_id}")
        except Exception as err:
            print("Erro ao registrar falha no banco:", err)
    finally:
        if conn is not None and not conn.closed:
            conn.close()


def main():
    print("Worker iniciado")
    db_connection_string = os.environ.get('DATABASE_URL')
    sqs_queue_url = os.environ.get('SQS_QUEUE_URL')
    
    try:
        sqs = boto3.client('sqs', region_name='us-east-1')
    except Exception as e:
        print("Erro criando client SQS:", e)
        time.sleep(10)
    
    while True:
        try:
            response = sqs.receive_message(
                QueueUrl=sqs_queue_url,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20
            )
            messages = response.get('Messages', [])
            if not messages:
                continue

            for msg in messages:
                try:
                    job_id = msg['Body']
                    print("Mensagem recebida:", job_id)
                    process_job(job_id, db_connection_string)

                    sqs.delete_message(
                        QueueUrl=sqs_queue_url,
                        ReceiptHandle=msg['ReceiptHandle']
                    )
                except Exception as job_err:
                    print("Erro processando mensagem:", job_err)

        except Exception as sqs_err:
            print("Erro recebendo mensagens SQS:", sqs_err)
            time.sleep(5)  # evita loop infinito rápido


if __name__ == "__main__":
    main()
