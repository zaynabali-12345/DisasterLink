import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './ReportsTab.css';
import jsPDF from 'jspdf'; // The core library
import autoTable from 'jspdf-autotable'; // The plugin
import Loader from './Loader';
import Message from './Message';

const ReportsTab = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [reportStats, setReportStats] = useState({ totalRequests: 0, requestsByStatus: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    disasterType: 'All',
    status: 'All',
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        // Fetch both the detailed list of requests and the summary report data in parallel
        const [requestsResponse, reportResponse] = await Promise.all([
          axios.get('/api/requests', config), // Endpoint for all individual requests
          axios.get('/api/requests/report', config) // Endpoint for summary data
        ]);

        setAllRequests(requestsResponse.data);
        setReportStats(reportResponse.data);

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredData = useMemo(() => {
    return allRequests.filter(req => {
      const requestDate = new Date(req.createdAt); // Use createdAt from the model
      const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

      if (dateFrom && requestDate < dateFrom) return false;
      if (dateTo && requestDate > dateTo) return false;
      if (filters.disasterType !== 'All' && req.disasterType !== filters.disasterType) return false;
      if (filters.status !== 'All' && req.status !== filters.status) return false;

      return true;
    });
  }, [allRequests, filters]);

  const summaryStats = useMemo(() => {
    // Helper to find count for a status, defaulting to 0
    const getCount = (status) => reportStats.requestsByStatus.find(s => s.status === status)?.count || 0;

    return {
      total: reportStats.totalRequests,
      completed: getCount('Completed'),
      pending: getCount('Pending'),
    };
  }, [reportStats]);

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) {
      return; // Don't download if there's no data
    }

    // 1. Define which data to include and how to format it
    const dataForCSV = filteredData.map(req => ({
      'Request ID': req._id,
      'Victim Name': req.name,
      'Contact': req.contact,
      'Location': req.location,
      'Description': req.description,
      'People Affected': req.people,
      'Priority': req.priority,
      'Request Type': req.requestType,
      'Status': req.status,
      'Date Submitted': new Date(req.createdAt).toLocaleString(),
    }));

    // 2. Convert JSON to CSV string using Papaparse
    const csv = Papa.unparse(dataForCSV);

    // 3. Create a Blob and trigger the download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `DisasterLink_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (filteredData.length === 0) {
      return;
    }

    const doc = new jsPDF();

    // 1. Add Title and Date
    doc.setFontSize(18);
    doc.text('DisasterLink - Requests Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // 2. Add Summary Statistics
    const summaryText = `Total Requests: ${summaryStats.total} | Completed: ${summaryStats.completed} | Pending: ${summaryStats.pending}`;
    doc.setFontSize(12);
    doc.text(summaryText, 14, 40);

    // 3. Define Table Columns and Rows
    const tableColumn = ["Request ID", "Victim Name", "Location", "Date", "Status", "Priority"];
    const tableRows = [];

    filteredData.forEach(req => {
      const requestData = [
        req._id.substring(req._id.length - 8),
        req.name,
        req.location,
        new Date(req.createdAt).toLocaleDateString(),
        req.status,
        req.priority,
      ];
      tableRows.push(requestData);
    });

    // 4. Add table to the PDF
    // FIX: Call autoTable as a function, passing the doc instance to it.
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50, // Start table after the title and summary
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] }, // Custom header color
    });

    // 5. Save the PDF
    doc.save(`DisasterLink_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div className="reports-tab-view">
      {/* 1. Filters Section */}
      <div className="report-filters">
        <div className="filter-group">
          <label htmlFor="dateFrom">From</label>
          <input type="date" id="dateFrom" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
        </div>
        <div className="filter-group">
          <label htmlFor="dateTo">To</label>
          <input type="date" id="dateTo" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
        </div>
        <div className="filter-group">
          <label htmlFor="disasterType">Disaster Type</label>
          <select id="disasterType" name="disasterType" value={filters.disasterType} onChange={handleFilterChange}>
            <option>All</option>
            <option>Flood</option>
            <option>Earthquake</option>
            <option>Landslide</option>
            <option>Fire</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
            <option>All</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Assigned</option>
          </select>
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="report-summary-cards">
        <div className="summary-card">
          <h3>Total Requests</h3>
          <p>{summaryStats.total}</p>
        </div>
        <div className="summary-card fulfilled"> {/* CSS class is 'fulfilled', text is 'Completed' */}
          <h3>Completed</h3>
          <p>{summaryStats.completed}</p>
        </div>
        <div className="summary-card pending">
          <h3>Pending</h3>
          <p>{summaryStats.pending}</p>
        </div>
      </div>

      {/* 3. Table Preview & 5. Empty State */}
      <div className="report-preview">
        <h4>Report Preview</h4>
        {filteredData.length > 0 ? (
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Victim Name</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 7).map(req => (
                  <tr key={req._id}>
                    <td>{req._id.substring(req._id.length - 6)}</td>
                    <td>{req.name}</td>
                    <td>{req.location}</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td><span className={`status-badge status-${req.status.toLowerCase()}`}>{req.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-message">
            <p>No requests found for the selected criteria. Try changing the filters.</p>
          </div>
        )}
      </div>

      {/* 4. Download Section */}
      <div className="report-download-section">
        <button className="btn-download csv" disabled={filteredData.length === 0} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button className="btn-download pdf" disabled={filteredData.length === 0} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default ReportsTab;