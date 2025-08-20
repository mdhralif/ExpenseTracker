import * as SQLite from 'expo-sqlite';

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  created_at?: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  categorySums: { [category: string]: number };
  monthlyData: { month: string; total: number }[];
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('expenses.db');
      
      // Create the expenses table with all required columns
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT (datetime('now'))
        );
      `);
      
      // Check if created_at column exists and add it if it doesn't
      await this.ensureCreatedAtColumn();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async ensureCreatedAtColumn(): Promise<void> {
    if (!this.db) return;
    
    try {
      // Check if created_at column exists
      const tableInfo = await this.db.getAllAsync(
        "PRAGMA table_info(expenses)"
      ) as { name: string }[];
      
      const hasCreatedAt = tableInfo.some(column => column.name === 'created_at');
      
      if (!hasCreatedAt) {
        console.log('Adding created_at column to expenses table');
        
        // Add column without default value first
        await this.db.execAsync(`
          ALTER TABLE expenses ADD COLUMN created_at DATETIME;
        `);
        
        // Update existing records to have created_at values using datetime('now')
        await this.db.execAsync(`
          UPDATE expenses SET created_at = datetime('now') WHERE created_at IS NULL;
        `);
        
        console.log('Created_at column added successfully');
      }
    } catch (error) {
      console.error('Error ensuring created_at column:', error);
      // If column addition fails, try a complete table recreation as fallback
      try {
        console.log('Attempting table recreation...');
        await this.recreateTableWithCreatedAt();
      } catch (recreateError) {
        console.error('Error recreating table:', recreateError);
        // Don't throw here as this is a migration step
      }
    }
  }

  private async recreateTableWithCreatedAt(): Promise<void> {
    if (!this.db) return;
    
    // Backup existing data
    const existingData = await this.db.getAllAsync('SELECT * FROM expenses') as any[];
    
    // Drop and recreate table
    await this.db.execAsync('DROP TABLE IF EXISTS expenses_backup');
    await this.db.execAsync(`
      CREATE TABLE expenses_backup AS SELECT * FROM expenses;
    `);
    
    await this.db.execAsync('DROP TABLE expenses');
    await this.db.execAsync(`
      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT (datetime('now'))
      );
    `);
    
    // Restore data with created_at
    if (existingData.length > 0) {
      for (const expense of existingData) {
        await this.db.runAsync(`
          INSERT INTO expenses (id, title, amount, category, date, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          expense.id,
          expense.title,
          expense.amount,
          expense.category,
          expense.date,
          expense.description || '',
          expense.created_at || new Date().toISOString()
        ]);
      }
    }
    
    // Clean up backup
    await this.db.execAsync('DROP TABLE IF EXISTS expenses_backup');
    console.log('Table recreated successfully with created_at column');
  }

  async addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.runAsync(
        'INSERT INTO expenses (title, amount, category, date, description) VALUES (?, ?, ?, ?, ?)',
        [expense.title, expense.amount, expense.category, expense.date, expense.description || '']
      );
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM expenses ORDER BY date DESC, id DESC'
      );
      
      return result as Expense[];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  async getExpenseById(id: number): Promise<Expense | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM expenses WHERE id = ?',
        [id]
      );
      
      return result as Expense | null;
    } catch (error) {
      console.error('Error fetching expense by id:', error);
      throw error;
    }
  }

  async updateExpense(id: number, expense: Omit<Expense, 'id' | 'created_at'>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ?, description = ? WHERE id = ?',
        [expense.title, expense.amount, expense.category, expense.date, expense.description || '', id]
      );
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async searchExpenses(query: string): Promise<Expense[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM expenses WHERE title LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY date DESC',
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );
      
      return result as Expense[];
    } catch (error) {
      console.error('Error searching expenses:', error);
      throw error;
    }
  }

  async getExpenseStats(): Promise<ExpenseStats> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Total expenses
      const totalResult = await this.db.getFirstAsync(
        'SELECT SUM(amount) as total FROM expenses'
      ) as { total: number };

      // Category sums
      const categoryResult = await this.db.getAllAsync(
        'SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC'
      ) as { category: string; total: number }[];

      // Monthly data
      const monthlyResult = await this.db.getAllAsync(
        `SELECT 
          strftime('%Y-%m', date) as month,
          SUM(amount) as total 
         FROM expenses 
         GROUP BY strftime('%Y-%m', date) 
         ORDER BY month DESC 
         LIMIT 12`
      ) as { month: string; total: number }[];

      const categorySums: { [category: string]: number } = {};
      categoryResult.forEach(item => {
        categorySums[item.category] = item.total;
      });

      return {
        totalExpenses: totalResult.total || 0,
        categorySums,
        monthlyData: monthlyResult
      };
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync('DELETE FROM expenses');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Drop the table and recreate it with proper schema
      await this.db.execAsync('DROP TABLE IF EXISTS expenses');
      await this.db.execAsync(`
        CREATE TABLE expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT (datetime('now'))
        );
      `);
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
        [startDate, endDate]
      );
      
      return result as Expense[];
    } catch (error) {
      console.error('Error fetching expenses by date range:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
