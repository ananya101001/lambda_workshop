'use strict';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import gm from 'gm';
import fs from 'fs/promises';

const imageMagick = gm.subClass({ imageMagick: true });

const colors = ["red", "blue", "yellow", "green"];
const maxFontSize = 28;
const minFontSize = 14;

const s3Client = new S3Client({ region: "us-east-1" }); // Replace with your region

export const create = async (event, context) => {
  try {
    const dogerand = Math.floor(Math.random() * 4 + 1);
    const dogefile = `doge${dogerand}.jpg`;
    const image = imageMagick(dogefile);
    const fileNum = Math.floor(Math.random() * 1000);
    const fileName = `/tmp/doge-${fileNum}.jpg`;
    const s3filename = `doge-${fileNum}.jpg`;

    const size = await new Promise((resolve, reject) => {
      image.size((err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });

    const { width: maxWidth, height: maxHeight } = size;

    for (const bird of event.queryStringParameters.text.split(" ")) {
      const fontSize = Math.floor(Math.random() * (maxFontSize - minFontSize) + minFontSize + 1);
      const x = Math.floor(Math.random() * (maxWidth - (fontSize * bird.length)));
      const y = Math.floor(Math.random() * (maxHeight - (fontSize * 2)) + fontSize);
      const color = colors[Math.floor(Math.random() * colors.length)];

      image.fontSize(fontSize).fill(color).drawText(x, y, bird);
    }

    console.log("Writing file: ", fileName);
    await new Promise((resolve, reject) => {
      image.write(fileName, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const imgdata = await fs.readFile(fileName);
    const s3params = {
      Bucket: 'serverless-framework-deployments-us-east-1-4ca6f522-0f10', // Replace with your bucket name
      Key: s3filename,
      Body: imgdata,
      ContentType: 'image/jpeg',
      ACL: "public-read"
    };

    const command = new PutObjectCommand(s3params);
    await s3Client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        text: `<https://s3.amazonaws.com/${s3params.Bucket}/${s3filename}>`,
        unfurl_links: true,
        response_type: "in_channel"
      })
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};