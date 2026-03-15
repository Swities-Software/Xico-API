require('dotenv').config();

const app = require('./src/app');
const supabase = require('./src/config/supabase');
const PORT = process.env.PORT || 3000;

const testConnection = async () => {
  const { error } = await supabase.from('businesses').select('count').limit(1);
  if (error) {
    console.error('Error conectando a Supabase:', error.message);
  } else {
    console.log('Conexión a Supabase exitosa');
  }
};

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  await testConnection();
});