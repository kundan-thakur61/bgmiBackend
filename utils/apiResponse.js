/**
 * Standardized API response helpers
 * Ensures consistent JSON response format across all endpoints
 */

class ApiResponse {
  /**
   * Success response
   * @param {Response} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {Object} meta - Additional metadata (pagination, etc.)
   */
  static success(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    const response = {
      success: true,
      message,
      ...(data !== null && { data }),
      ...(Object.keys(meta).length > 0 && { meta }),
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Created response (201)
   */
  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Paginated response
   * @param {Response} res - Express response object
   * @param {Array} data - Array of items
   * @param {Object} pagination - { page, limit, total, totalPages }
   * @param {string} message - Success message
   */
  static paginated(res, data, pagination, message = 'Success') {
    return ApiResponse.success(res, data, message, 200, {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages || Math.ceil(pagination.total / pagination.limit),
        hasNextPage: pagination.page < (pagination.totalPages || Math.ceil(pagination.total / pagination.limit)),
        hasPrevPage: pagination.page > 1
      }
    });
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Error response (used by error handler, but also available for custom errors)
   */
  static error(res, message = 'Error', statusCode = 500, errors = null, code = null) {
    const response = {
      success: false,
      message,
      ...(code && { code }),
      ...(errors && { errors }),
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
