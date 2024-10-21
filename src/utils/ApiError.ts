class ApiError extends Error {
  public statusCode: number
  public data: Record<string, unknown> | null // More specific type for data
  public success: boolean
  public errors: string[] // More specific type for errors

  constructor(
    statusCode: number,
    message = 'An unexpected error occurred.', // More descriptive default message
    errors: string[] = [],
    data: Record<string, unknown> | null = null, // Added data parameter
  ) {
    super(message)
    this.statusCode = statusCode
    this.success = false
    this.errors = errors
    this.data = data

    // Capture the stack trace only if it is available
    Error.captureStackTrace(this, this.constructor)
  }
}

export { ApiError }
