import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { file } = req.query;
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...(Array.isArray(file) ? file : [file]));

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(data);
    });
}
