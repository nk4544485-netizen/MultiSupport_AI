import { useEffect, useState } from "react";
import API from "../services/api";

function Admin() {
  const [stats, setStats] = useState({});
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const statsRes = await API.get("/admin/stats");
      const ticketsRes = await API.get("/admin/tickets");

      setStats(statsRes.data);
      setTickets(ticketsRes.data.tickets);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>📊 MultiSupport AI Dashboard</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: "15px",
        marginBottom: "30px"
      }}>

        <Card title="Total" value={stats.total_tickets} />
        <Card title="Billing" value={stats.billing} />
        <Card title="Technical" value={stats.technical} />
        <Card title="Sales" value={stats.sales} />
        <Card title="General" value={stats.general} />

      </div>

      <h2>Support Tickets</h2>

      <table
        border="1"
        cellPadding="10"
        style={{
          width: "100%",
          borderCollapse: "collapse"
        }}
      >
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Department</th>
            <th>Status</th>
            <th>Customer</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((t, i) => (
            <tr key={i}>
              <td>{t.ticket_id}</td>
              <td>{t.department}</td>
              <td>{t.status}</td>
              <td>{t.email}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "20px",
        textAlign: "center"
      }}
    >
      <h3>{title}</h3>
      <h1>{value ?? 0}</h1>
    </div>
  );
}

export default Admin;