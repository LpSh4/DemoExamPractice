// prisma.config.js
import { defineConfig } from '@prisma/config';

export default defineConfig({
    datasource: {
        url: 'postgresql://postgres:yourpassword@89.109.16.50:5432/postgres'
    },
});