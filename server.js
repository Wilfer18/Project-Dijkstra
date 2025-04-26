//Importación de las dependencias necesarias
const { Socket } = require('dgram');
const express = require( 'express'); //Framework para crear el servidor web 
const http = require('http'); //Módulo de Node para trabajar con el protocolo HTTP
const { Server } = require('socket.io'); //Socket.IO para comunicación en tiempo real

//Creamos aplicación express
const app = express();

//Creamos el servidor HTTP sobre la aplicación express
const server = http.createServer(app);

//Inicializamos Socet.IO pasando el servidor HTTP
const io = new Server(server);

//Definimos el puerto en el que se escuchará el servidor
const PORT = process.env.PORT || 3000;

// Indicamos a Express que sirva archivos estáticos
// Por ejemplo, la carpeta "public" contendrá nuestros archivos HTML, CSS y JavaScript del frontend
app.use(express.static('public'));

// Grafo de ejemplo (direccional y con pesos)
const sampleGraph = {
    'A': { 'B': 4, 'C': 2 },
    'B': { 'C': 5, 'D': 10 },
    'C': { 'E': 3 },
    'D': { 'F': 11 },
    'E': { 'D': 4 }
  };
  
//Función Dijkstra e implementación tiempo real
function runDijkstra(graph, source, socket) {
    // Inicialización de distancias y predecesores
    const distances = {};
    const previous = {};
    const queue = new Set();
  
    for (let node in graph) {
      distances[node] = Infinity;
      previous[node] = null;
      queue.add(node);
    }
    // El nodo fuente tiene distancia cero
    distances[source] = 0;
  
    // Función interna que simula un paso del algoritmo
    const stepByStepIteration = () => {
      if (queue.size === 0) {
        // Si la cola se vacía, el algoritmo concluye
        socket.emit('algorithmFinished', { distances, previous });
        return;
      }
    
      // Encontrar el nodo con la menor distancia en la cola
      let current = null;
      for (const node of queue) {
        if (current === null || distances[node] < distances[current]) {
          current = node;
        }
      }
    
      // Quitar el nodo actual de la cola
      queue.delete(current);
    
      // Emitir un evento informando del paso actual
      socket.emit('algorithmStep', {
        current,
        distances: { ...distances },
        previous: { ...previous }
      });
    
      // Actualizar las distancias de los vecinos del nodo actual
      if (graph[current]) {
        for (const neighbor in graph[current]) {
          if (queue.has(neighbor)) {
            const alt = distances[current] + graph[current][neighbor];
            if (alt < distances[neighbor]) {
              distances[neighbor] = alt;
              previous[neighbor] = current;
            }
          }
        }
      }
    
      // Esperar 1 segundo antes de ejecutar el siguiente paso (para visualización)
      setTimeout(stepByStepIteration, 1000);
    };
  
    stepByStepIteration();
  }
  
//Fin de la función dijkstra

//Manejo de conexiones con Socket.IO
io.on ('connection', (socket) => {
    console.log('Un nuevo cliente se ha conectado.');

    //Escuchar eventos enviados del usuario
    //Ejemplo: escuchar eventos enviados por el cliente para comenzar la visualización del algoritmo
    socket.on('startAlgorithm', (data) => {
        console.log('Inicia algoritmo Dijkstra:', data);
        //Implementación del algoritmo dijkstra
        //Llamada a la función dijkstra
        const source = data.source || 'A';
        runDijkstra(sampleGraph, source, socket);
    });

    //Cuando el cliente se desconecta
    socket.on('disconnect', () => {
    console.log('Cliente desconectado.');
    });
});

//Iniciamos el servidor ue escuchará en el puerto definido
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});





