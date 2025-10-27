import serverlessExpress from '@codegenie/serverless-express'
import express from 'express'
import { createRequestHandler } from '@react-router/express'
import * as build from "./build/server/index.js";

const app = express()
app.all('/{*any}', createRequestHandler({ build }))

export async function handler(event, context) {
    return serverlessExpress({ app })(event, context)
}
