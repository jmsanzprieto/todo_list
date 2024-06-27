const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { format, isValid } = require('date-fns');
const { v4: uuidv4 } = require('uuid'); // Importar uuid
const esLocale = require('date-fns/locale/es');
const app = express();
const port = 3000;

// Función para formatear una fecha a formato dd/mm/AAAA
function formatDate(dateString) {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    if (!isValid(dateObj)) return 'Fecha inválida';
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

// Configuración de EJS como motor de plantillas
app.set('view engine', 'ejs');

// Middleware para parsear el body de las peticiones POST
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos
app.use(express.static(__dirname + '/public'));

// Middleware para renderizar las vistas con formato de fechas
app.use((req, res, next) => {
    res.locals.formatDate = formatDate;
    next();
});

// Ruta principal - Renderiza la página inicial con la lista de tareas
app.get('/', (req, res) => {
    fs.readFile('tasks.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.render('error');
            return;
        }
        const tasks = JSON.parse(data);
        // Formatea las fechas en formato dd/mm/AAAA
        tasks.forEach(task => {
            task.fechaCreacion = formatDate(task.fechaCreacion);
            task.fechaFinalizacion = formatDate(task.fechaFinalizacion);
        });
        res.render('index', { tasks: tasks });
    });
});

// Ruta para agregar una nueva tarea desde el modal
app.post('/addTask', (req, res) => {
    const newTask = {
        id: uuidv4(), // Generar un ID único para la tarea
        tarea: req.body.newTask,
        descripcion: req.body.descrTask,
        completada: 0,
        fechaCreacion: new Date().toISOString(), // Guarda la fecha de creación en formato ISO 8601
        fechaFinalizacion: req.body.dueDate // Captura la fecha de finalización desde el formulario (en formato ISO 8601)
    };

    fs.readFile('tasks.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.render('error');
            return;
        }
        const tasks = JSON.parse(data);
        tasks.push(newTask);

        fs.writeFile('tasks.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(err);
                res.render('error');
                return;
            }
            res.redirect('/');
        });
    });
});

// Ruta para marcar una tarea como completada
app.post('/completeTask/:id', (req, res) => {
    const id = req.params.id;

    fs.readFile('tasks.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.render('error');
            return;
        }
        const tasks = JSON.parse(data);

        // Marcar la tarea como completada (cambiar el valor de completada a 1)
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.completada = 1;
        }

        fs.writeFile('tasks.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(err);
                res.render('error');
                return;
            }
            res.redirect('/');
        });
    });
});

// Ruta para borrar una tarea completada
app.post('/deleteTask/:id', (req, res) => {
    const id = req.params.id;

    fs.readFile('tasks.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.render('error');
            return;
        }
        let tasks = JSON.parse(data);

        // Filtrar la tarea a eliminar
        tasks = tasks.filter(task => task.id !== id);

        fs.writeFile('tasks.json', JSON.stringify(tasks, null, 2), (err) => {
            if (err) {
                console.error(err);
                res.render('error');
                return;
            }
            res.redirect('/');
        });
    });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).render('error');
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
