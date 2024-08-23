import axios from 'axios';

interface Location {
  name: string;
  id: string;
}

interface Employee {
  name: string;
  id: string;
  categoryCode: string;
}

interface Transaction {
  transactionID: string;
  timeStamp: string;
  amount: number;
  type: string;
  location: Location;
  employee: Employee;
}

interface TaskResponse {
  id: string;
  transactions: Transaction[];
}

interface SubmitTaskRequest {
  id: string;
  result: string[];
}

async function getTask(): Promise<void> {
  try {
    const response = await axios.get<TaskResponse>('https://interview.adpeai.com/api/v2/get-task');
    const { id, transactions } = response.data;

    const lastYear = new Date().getFullYear() - 1;
    const lastYearTransactions = transactions.filter(tx => {
      const txYear = new Date(tx.timeStamp).getFullYear();
      return txYear === lastYear;
    });

    const employeeEarnings = lastYearTransactions.reduce<Record<string, { name: string; totalAmount: number; transactions: Transaction[] }>>((acc, tx) => {
      const employeeId = tx.employee.id;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          name: tx.employee.name,
          totalAmount: 0,
          transactions: [],
        };
      }
      acc[employeeId].totalAmount += tx.amount;
      acc[employeeId].transactions.push(tx);
      return acc;
    }, {});

    const topEarner = Object.values(employeeEarnings).reduce((top, current) => {
      return current.totalAmount > top.totalAmount ? current : top;
    }, { name: '', totalAmount: 0, transactions: [] });

    const alphaTransactionIDs = topEarner.transactions
      .filter(tx => tx.type === 'alpha')
      .map(tx => tx.transactionID);

    const submitResponse = await axios.post<unknown>('https://interview.adpeai.com/api/v2/submit-task', {
      id: id,
      result: alphaTransactionIDs,
    } as SubmitTaskRequest);

    console.log('Response Status:', submitResponse.status);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getTask();
