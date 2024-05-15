const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Image, Tag, ImageTag } = require('./models');
const sequelize = require('./database');
const { uploadImageToBlob } = require('./azureBlob');
const axios = require('axios');
const { ComputerVisionClient } = require("@azure/cognitiveservices-computervision");
const { CognitiveServicesCredentials } = require("@azure/ms-rest-azure-js");
const { Op } = require('sequelize');

const app = express();
const upload = multer({ dest: 'uploads/' });

const AZURE_COGNITIVE_SERVICE_ENDPOINT = process.env.AZURE_COGNITIVE_SERVICE_ENDPOINT;
const AZURE_COGNITIVE_SERVICE_KEY = process.env.AZURE_COGNITIVE_SERVICE_KEY;

const credentials = new CognitiveServicesCredentials(AZURE_COGNITIVE_SERVICE_KEY);
const client = new ComputerVisionClient(credentials, AZURE_COGNITIVE_SERVICE_ENDPOINT);

app.use(express.json());

app.post('/upload', upload.single('image'), async (req, res) => {
    const file = req.file;
    const blobName = `${Date.now()}-${file.originalname}`;
    const imagePath = path.resolve(file.path);

    try {
        const imageUrl = await uploadImageToBlob(imagePath, blobName);
        const image = await Image.create({ url: imageUrl });

        const response = await client.analyzeImage(imageUrl, { visualFeatures: ['Description', 'Tags'] });

        const description = response.description.captions[0]?.text || '';
        image.description = description;
        await image.save();

        const tags = response.tags;
        console.log(image.id);
        for (const tag of tags) {
            let [tagRecord] = await Tag.findOrCreate({ where: { name: tag.name } });
            await ImageTag.create({ relevance: tag.confidence, ImageId: image.id, TagId: tagRecord.id});
        }

        res.json(image);
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    } finally {
        fs.unlinkSync(imagePath);
    }
});

app.get('/images', async (req, res) => {
    const images = await Image.findAll();
    res.json(images);
});

app.get('/tags', async (req, res) => {
    const tags = await Tag.findAll();
    res.json(tags);
});

app.get('/search', async (req, res) => {
    const { q } = req.query;
    const images = await Image.findAll({
        where: {
            description: {
                [Op.like]: `%${q}%`
            }
        },
        include: Tag
    });
    res.json(images);
});

app.get('/search/tags', async (req, res) => {
    const { tag } = req.query;
    const images = await Image.findAll({
        include: {
            model: Tag,
            where: {
                name: tag
            }
        }
    });
    res.json(images);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
