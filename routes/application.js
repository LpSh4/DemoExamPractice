module.exports = async function (fastify) {
    fastify.get('/', (req, res) => {
        res.status(200).send('application');
    })
}