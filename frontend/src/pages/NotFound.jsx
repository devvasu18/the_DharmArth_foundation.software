import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartOff, Home, HeartHandshake } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-container">
            <motion.div
                className="not-found-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div
                    className="icon-wrapper"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2
                    }}
                >
                    <HeartOff size={64} strokeWidth={1.5} />
                </motion.div>

                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">We couldn't find that path</h2>

                <p className="not-found-text">
                    Just like a lost soul looking for hope, this page seems to be missing.
                    But don't worry, every wrong turn is just another chance to find the right direction.
                    There are still many lives waiting for your support.
                </p>

                <div className="action-buttons">
                    <Link to="/" className="btn btn-outline">
                        <Home size={20} />
                        Back Home
                    </Link>
                    <Link to="/donate" className="btn btn-primary">
                        <HeartHandshake size={20} />
                        Make a Difference
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
