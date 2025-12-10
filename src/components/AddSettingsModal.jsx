import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { getVendors, createSetting, updateSetting } from '../lib/settingsApi';

const AddSettingsModal = ({ isOpen, onClose, onSubmit, initialData, isEdit = false }) => {
  const [formData, setFormData] = useState({
    vendor: '',
    title: '',
    channel: '',
    hook_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch vendors when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  // Populate form when editing or when initialData is provided
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen && !initialData) {
      // Reset form when opening without initial data
      setFormData({
        vendor: '',
        title: '',
        channel: '',
        hook_url: ''
      });
    }
  }, [isOpen, initialData, isEdit]);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await getVendors();
      
      if (!response.error && response.data) {
        setVendors(response.data);
      } else {
        console.warn('Failed to fetch vendors from API:', response.message);
        console.warn('Using fallback vendor list');
        // Fallback to default vendors if API fails (e.g., authentication issues)
        // This ensures the modal still works even if the vendors API is unavailable
        const fallbackVendors = [
          { ven_code: 'slack', title: 'Slack' },
          { ven_code: 'discord', title: 'Discord' },
          { ven_code: 'telegram', title: 'Telegram' },
          { ven_code: 'teams', title: 'Microsoft Teams' },
          { ven_code: 'gwhook', title: 'Generic Web Hook' }
        ];
        setVendors(fallbackVendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Fallback to default vendors on error
      const fallbackVendors = [
        { ven_code: 'slack', title: 'Slack' },
        { ven_code: 'discord', title: 'Discord' },
        { ven_code: 'telegram', title: 'Telegram' },
        { ven_code: 'teams', title: 'Microsoft Teams' },
        { ven_code: 'gwhook', title: 'Generic Web Hook' }
      ];
      setVendors(fallbackVendors);
    } finally {
      setLoadingVendors(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Channel is only required for non-custom webhook vendors
    const isChannelRequired = formData.vendor !== 'gwhook';
    const requiredFields = !formData.vendor || !formData.title || !formData.hook_url;
    const channelRequired = isChannelRequired && !formData.channel;
    
    if (requiredFields || channelRequired) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // If onSubmit is provided (from parent), use it, otherwise call createSetting directly
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        const response = await createSetting(formData);
        if (response.error) {
          alert(`Error: ${response.message}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Reset form and close modal on success
      setFormData({
        vendor: '',
        title: '',
        channel: '',
        hook_url: ''
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        vendor: '',
        title: '',
        channel: '',
        hook_url: ''
      });
      onClose();
    }
  };

  useEffect(() => {
    console.log('AddSettingsModal isOpen changed:', isOpen);
  }, [isOpen]);

  if (!isOpen) {
    console.log('Modal not rendering because isOpen is false');
    return null;
  }

  console.log('Modal rendering with isOpen:', isOpen);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {isEdit ? 'Edit Settings' : 'Add New Settings'}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isEdit ? 'Update your webhook settings' : 'Configure a new webhook integration'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vendor Selection */}
            <div className="space-y-2">
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
              Vendor
            </label>
            <select
              id="vendor"
              value={formData.vendor}
              onChange={(e) => handleInputChange('vendor', e.target.value)}
              disabled={isSubmitting || loadingVendors}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingVendors ? 'Loading vendors...' : 'Select vendor'}
              </option>
              {vendors.map((vendor) => (
                <option key={vendor.ven_code} value={vendor.ven_code}>
                  {vendor.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Slack Web Hook"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Channel - Only show for non-custom webhook vendors */}
          {formData.vendor && formData.vendor !== 'gwhook' && (
            <div className="space-y-2">
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
                {formData.vendor === 'slack' ? 'Slack Channel' : 'Channel'}
              </label>
              <input
                id="channel"
                type="text"
                placeholder="e.g., social"
                value={formData.channel}
                onChange={(e) => handleInputChange('channel', e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Hook URL */}
          <div className="space-y-2">
            <label htmlFor="hook_url" className="block text-sm font-medium text-gray-700">
              Hook URL
            </label>
            <input
              id="hook_url"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={formData.hook_url}
              onChange={(e) => handleInputChange('hook_url', e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isSubmitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Settings' : 'Add Settings')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSettingsModal;

