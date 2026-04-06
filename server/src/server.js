const express = require('express');
const healthRouter = require('./routes/healthRouter');

const app = express();
app.use('/api/health', healthRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT , () => {
    console.log(`Server is running on port ${PORT}`);
     console.log(` Health Check: http://localhost:${PORT}/api/health `)
})