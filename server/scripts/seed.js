import { initializeDatabase } from '../database/initialize.js';
import { getDb, closeDb } from '../database/connection.js';
import { seedDemoCatalogue } from '../database/seedDemo.js';

const db = initializeDatabase();
seedDemoCatalogue(db);
closeDb();
