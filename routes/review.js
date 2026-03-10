module.exports = async function (fastify) {
    fastify.get('/', (req, res) => {
        res.render('application');
    })
}