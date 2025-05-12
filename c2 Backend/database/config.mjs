import mongoose from "mongoose"


const connections = {};

// Función para conectar a todas las bases de datos
export const db_connection = async () => {
  try {
    // Conexión a cada base de datos
    connections.IPV6_PORT1 = await mongoose.connect(process.env.USER);
    
    console.log('✅ Todas las bases de datos conectadas');
  } catch (error) {
    console.error('❌ Error al conectar las bases de datos:', error);
    process.exit(1);
  }
};


// Manejar cierre de conexión en terminación de la aplicación
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});




export default db_connection