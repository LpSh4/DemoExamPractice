const fastify = require('fastify')({logger: true});
const fastifyView = require('@fastify/view')
const fastifyStatic = require('@fastify/static')
const ejs = require('ejs');
const path = require('path');
const { fileURLToPath } = require('url');

fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, './public'),
    prefix: '/public'
})

fastify.register(fastifyView, {
    engine: { ejs },
    root: path.resolve(__dirname, 'views'),
    layout: 'layout.ejs'
})

const API_BASE_URL = 'http://89.109.16.50:911'

async function apiJson(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}/${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    })
    if (res.status !== 200) {
        throw new Error(`API error: ${res.status}`)
    }
    if (res.status === 204) return null
    return res.json()
}

fastify.get('/signup', async (req, res) => {
    return res.view('signup.ejs', {title: 'Sign up', layout: 'layout.ejs'})
});

fastify.listen({port: 3000, host: '0.0.0.0'}, (e) => {
    if (e) throw e
    console.log(`server started at http://0.0.0.0:3000`)
})