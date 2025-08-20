import { databaseService } from '../services/DatabaseService';

export const insertDemoData = async () => {
  const demoExpenses = [
    {
      title: 'Grocery Shopping',
      amount: 85.50,
      category: 'Food',
      date: '2025-08-18',
      description: 'Weekly grocery shopping at supermarket'
    },
    {
      title: 'Gas Station',
      amount: 45.00,
      category: 'Transportation',
      date: '2025-08-17',
      description: 'Fuel for car'
    },
    {
      title: 'Movie Tickets',
      amount: 28.00,
      category: 'Entertainment',
      date: '2025-08-16',
      description: 'Evening movie with friends'
    },
    {
      title: 'Coffee Shop',
      amount: 12.50,
      category: 'Food',
      date: '2025-08-15',
      description: 'Morning coffee and pastry'
    },
    {
      title: 'Pharmacy',
      amount: 23.75,
      category: 'Healthcare',
      date: '2025-08-14',
      description: 'Prescription medication'
    },
    {
      title: 'Electricity Bill',
      amount: 120.00,
      category: 'Bills',
      date: '2025-08-13',
      description: 'Monthly electricity bill'
    },
    {
      title: 'Book Purchase',
      amount: 35.99,
      category: 'Education',
      date: '2025-08-12',
      description: 'Programming textbook'
    },
    {
      title: 'New Shirt',
      amount: 55.00,
      category: 'Shopping',
      date: '2025-08-11',
      description: 'Casual shirt for work'
    },
    {
      title: 'Restaurant Dinner',
      amount: 78.25,
      category: 'Food',
      date: '2025-08-10',
      description: 'Dinner at Italian restaurant'
    },
    {
      title: 'Uber Ride',
      amount: 15.50,
      category: 'Transportation',
      date: '2025-08-09',
      description: 'Ride to downtown'
    }
  ];

  try {
    for (const expense of demoExpenses) {
      await databaseService.addExpense(expense);
    }
    console.log('Demo data inserted successfully');
  } catch (error) {
    console.error('Error inserting demo data:', error);
  }
};
