const express = require('express');
const router = express.Router();

const Idea = require('../models/Idea'); 

const { idGenerator } = require('../util/util');

router.get('/', (req, res) => {
    res.status(200).send('idea route home').end();
})

router.post('/new', (req, res) => {
    let [ title, type, authorId, text ] = [ req.body.title, req.body.type, req.body.authorId, req.body.text ]

    let newIdea = new Idea({
        id: idGenerator(),
        type,
        title,
        text,
        authorId,
    })
    newIdea.save()
        .then(data => res.status(200).json(data).end())
        .catch(err => console.log(err))
});

router.get('/foruser', (req, res) => {
    let authorId = req.body.id;

    Idea.find({ authorId, })
        .then(data => res.status(200).json(data).end)
        .catch(err => res.status(404).send(err).end())
})

module.exports = router;