import React, { useEffect, useState } from "react";
import { authService } from "../../services/api";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUserTag,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import "./Profile.css";
import usePageTitle from '../../hooks/usePageTitle';

const Profile = () => {
  usePageTitle('User Profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        setProfile(response.data);
      } catch (error) {
        toast.error(error.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Zantech</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <p>View and manage your account details</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <FaUser size={50} />
          </div>

          <div className="profile-info">
            <div className="info-group">
              <div className="info-label">
                <FaUser className="info-icon" />
                <span>Name</span>
              </div>
              <div className="info-value">{profile?.name}</div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaEnvelope className="info-icon" />
                <span>Email</span>
              </div>
              <div className="info-value">{profile?.email}</div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaPhone className="info-icon" />
                <span>Phone</span>
              </div>
              <div className="info-value">
                {profile?.phone || "Not provided"}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaUserTag className="info-icon" />
                <span>Role</span>
              </div>
              <div className="info-value">
                <span className={`role-badge ${profile?.type}`}>
                  {profile?.type?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaCalendarAlt className="info-icon" />
                <span>Member Since</span>
              </div>
              <div className="info-value">
                {formatDate(profile?.created_at)}
              </div>
            </div>

            <div className="info-group">
              <div className="info-label">
                <FaClock className="info-icon" />
                <span>Last Updated</span>
              </div>
              <div className="info-value">
                {formatDate(profile?.updated_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
