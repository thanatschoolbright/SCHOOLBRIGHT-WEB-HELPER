import axios from 'axios';
import { logger } from '@/helpers/logger';

// API Base URLs
const API_BASE_URL = '/api/v1/hardware/canteen';

// Types
export interface ApplicationRecord {
    app_id: string;
    app_name: string;
    app_type: string;
    created_at: string;
    updated_at: string;
}

export interface VersionRecord {
    version_id: string;
    app_id: string;
    version_name: string;
    env: string;
    note?: string;
    is_lastest_version: boolean;
    force_update: boolean;
    file_url?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateVersionPayload {
    school_id?: string;
    app_id: string;
    version_name: string;
    env: string;
    note?: string;
    is_lastest_version: boolean;
    force_update: boolean;
    file?: File;
}

export interface UpdateVersionPayload extends CreateVersionPayload {
    version_id: string;
}

// API Functions
export const canteenAPI = {
    // Get applications list
    getApplications: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/application`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching applications:', error);
            throw error;
        }
    },

    // Get versions by app_id
    getVersionsByAppId: async (appId: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/version/${appId}`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching versions:', error);
            throw error;
        }
    },

    // Create new version with multipart/formdata
    createVersion: async (payload: CreateVersionPayload) => {
        try {
            const formData = new FormData();

            // Append text fields
            formData.append('school_id', payload.school_id || '');
            formData.append('app_id', payload.app_id);
            formData.append('version_name', payload.version_name);
            formData.append('env', payload.env);
            formData.append('note', payload.note || '');
            formData.append('is_lastest_version', payload.is_lastest_version ? '1' : '0');
            formData.append('force_update', payload.force_update ? '1' : '0');

            // Append file if exists
            if (payload.file) {
                formData.append('file', payload.file);
            }

            const response = await axios.post(`${API_BASE_URL}/version`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            logger.error('Error creating version:', error);
            throw error;
        }
    },

    // Update version with multipart/formdata
    updateVersion: async (payload: UpdateVersionPayload) => {
        try {
            const formData = new FormData();

            // Append text fields
            formData.append('version_id', payload.version_id);
            formData.append('school_id', payload.school_id || '');
            formData.append('app_id', payload.app_id);
            formData.append('version_name', payload.version_name);
            formData.append('env', payload.env);
            formData.append('note', payload.note || '');
            formData.append('is_lastest_version', payload.is_lastest_version ? '1' : '0');
            formData.append('force_update', payload.force_update ? '1' : '0');

            // Append file if exists
            if (payload.file) {
                formData.append('file', payload.file);
            }

            const response = await axios.put(`${API_BASE_URL}/version/${payload.version_id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            logger.error('Error updating version:', error);
            throw error;
        }
    },

    // Delete version
    deleteVersion: async (versionId: string) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/version/${versionId}`);
            return response.data;
        } catch (error) {
            logger.error('Error deleting version:', error);
            throw error;
        }
    }
};
