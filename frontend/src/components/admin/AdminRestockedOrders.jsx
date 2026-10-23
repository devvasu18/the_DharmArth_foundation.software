import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Sparkles, PackageCheck, AlertCircle, IndianRupee,
    ArrowRight, CheckCircle, RefreshCw, Send, Clock, RotateCcw
} from 'lucide-react';
import './AdminRestockedOrders.css';

const AdminRestockedOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [revisedTotal, setRevisedTotal] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRestockedOrders();
    }, []);

    const fetchRestockedOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/advance-orders/restocked');
            setOrders(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load restocked advance orders');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        setRevisedTotal(order.totalAmount || '');
    };

    const handleRecalculate = async () => {
        if (!selectedOrder) return;
        setSubmitting(true);
        try {
            await api.post(`/orders/${selectedOrder._id}/recalculate-price`, {
                revisedTotal: Number(revisedTotal)
            });
            toast.success('Price recalculated! Order moved to Ready for Packing.');
            setSelectedOrder(null);
            fetchRestockedOrders();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update price');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRefundAdvance = async () => {
        if (!selectedOrder) return;
        if (!window.confirm(`Refund advance token ₹${selectedOrder.advancePaymentDetails?.advanceAmountPaid || 0} back to patient's wallet?`)) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/orders/${selectedOrder._id}/refund-advance`);
            toast.success(res.data.message || 'Advance amount refunded successfully');
            setSelectedOrder(null);
            fetchRestockedOrders();
        } catch (error) {
            console.error(error);
            toast.error('Failed to process advance refund');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="restocked-orders-page">
            <div className="restocked-header">
                <div>
                    <h1>
                        <Sparkles className="icon-sparkle" />
                        Restocked Advance Orders Queue
                    </h1>
                    <p>Fulfill waiting advance orders whose out-of-stock items have arrived in MARG ERP. Recalculate price hikes and trigger packing.</p>
                </div>
                <button className="btn-refresh" onClick={fetchRestockedOrders}>
                    <RefreshCw size={16} /> Refresh Restock Queue
                </button>
            </div>

            {loading ? (
                <div className="loading-card">
                    <Clock className="spin-icon" />
                    <p>Checking incoming MARG batches...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="empty-restock-card">
                    <PackageCheck size={48} className="empty-icon" />
                    <h3>No Pending Restocked Orders</h3>
                    <p>All backordered items have either been packed or are currently awaiting arrival from distributors.</p>
                </div>
            ) : (
                <div className="restocked-grid">
                    <div className="orders-table-card">
                        <h2>Waiting Orders ({orders.length})</h2>
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Tentative Rate</th>
                                        <th>Advance Paid</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => {
                                        const advancePaid = o.advancePaymentDetails?.advanceAmountPaid || 0;
                                        return (
                                            <tr key={o._id} className={selectedOrder?._id === o._id ? 'selected-row' : ''}>
                                                <td><strong>#{o._id.slice(-6).toUpperCase()}</strong></td>
                                                <td>
                                                    <div>{o.user?.name || 'Customer'}</div>
                                                    <small className="text-muted">{o.user?.mobile}</small>
                                                </td>
                                                <td>₹{o.totalAmount}</td>
                                                <td><span className="advance-tag">₹{advancePaid}</span></td>
                                                <td><span className="status-pill">{o.status}</span></td>
                                                <td>
                                                    <button
                                                        className="btn-recalculate-view"
                                                        onClick={() => handleSelectOrder(o)}
                                                    >
                                                        Review & Recalculate
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Price Revision Workspace */}
                    {selectedOrder && (
                        <div className="revision-panel-card">
                            <h3>Recalculate Batch Price & Move to Packing</h3>
                            <div className="order-summary-box">
                                <p><strong>Order:</strong> #{selectedOrder._id.slice(-6).toUpperCase()}</p>
                                <p><strong>Customer:</strong> {selectedOrder.user?.name} ({selectedOrder.user?.mobile})</p>
                                <div className="math-row">
                                    <span>Advance Paid (Token):</span>
                                    <strong>₹{selectedOrder.advancePaymentDetails?.advanceAmountPaid || 0}</strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Incoming MARG Final Batch Total (₹):</label>
                                <input
                                    type="number"
                                    value={revisedTotal}
                                    onChange={(e) => setRevisedTotal(e.target.value)}
                                    placeholder="Enter new total based on MARG MRP"
                                />
                                <small>e.g. If previous price was ₹110 and new batch is ₹130, enter 130.</small>
                            </div>

                            <div className="balance-calc-preview">
                                <div className="calc-row">
                                    <span>New Total Amount:</span>
                                    <span>₹{revisedTotal || 0}</span>
                                </div>
                                <div className="calc-row">
                                    <span>Less Advance Paid:</span>
                                    <span>- ₹{selectedOrder.advancePaymentDetails?.advanceAmountPaid || 0}</span>
                                </div>
                                <div className="calc-row total">
                                    <span>Net Pending Balance Due:</span>
                                    <strong>
                                        ₹{Math.max(0, (Number(revisedTotal) || 0) - (selectedOrder.advancePaymentDetails?.advanceAmountPaid || 0))}
                                    </strong>
                                </div>
                            </div>

                            <button
                                className="btn-confirm-revision"
                                disabled={submitting}
                                onClick={handleRecalculate}
                            >
                                <Send size={16} /> Confirm Price & Send to Packing
                            </button>

                            <button
                                type="button"
                                style={{
                                    marginTop: '10px',
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: '1px solid #fca5a5',
                                    background: '#fff1f2',
                                    color: '#be123c',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                                disabled={submitting}
                                onClick={handleRefundAdvance}
                            >
                                <RotateCcw size={15} /> 1-Click Advance Refund to Wallet (SLA Limit Exceeded)
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminRestockedOrders;
