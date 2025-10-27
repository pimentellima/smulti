import { MediaConvert } from '@aws-sdk/client-mediaconvert'

const client = new MediaConvert({})

const mediaConvertRoleArn = process.env.MEDIACONVERT_ROLE_ARN!

export async function addConversionToMediaConvert(
    mergedFormatId: string,
    data: {
        audioInput: string
        videoInput: string
        output: string
    },
) {
    const { audioInput, videoInput, output } = data

    return await client.createJob({
        UserMetadata: {
            mergedFormatId,
        },
        Role: mediaConvertRoleArn,
        Settings: {
            Inputs: [
                {
                    FileInput: audioInput,
                    AudioSelectors: {},
                    VideoSelector: {},
                },
                {
                    FileInput: videoInput,
                    AudioSelectors: {
                        'Audio Selector 1': {
                            DefaultSelection: 'DEFAULT',
                        },
                    },
                },
            ],
            OutputGroups: [
                {
                    Name: 'File Group',
                    OutputGroupSettings: {
                        Type: 'FILE_GROUP_SETTINGS',
                        FileGroupSettings: {
                            Destination: output,
                        },
                    },
                    Outputs: [
                        {
                            ContainerSettings: {
                                Container: 'MP4',
                            },
                            VideoDescription: {
                                CodecSettings: {
                                    Codec: 'H_264',
                                },
                            },
                            AudioDescriptions: [
                                {
                                    AudioSourceName: 'Audio Selector 1',
                                    CodecSettings: {
                                        Codec: 'AAC',
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    })
}
