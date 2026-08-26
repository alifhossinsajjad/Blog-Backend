import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong!';
  let errorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorSources = err.issues.map((issue) => {
      return {
        path: issue.path[issue.path.length - 1] as string,
        message: issue.message,
      };
    });
  } else if (err?.code === 'P2002') {
    // Prisma Unique Constraint Error
    statusCode = 409;
    message = 'Duplicate Entry';
    errorSources = [
      {
        path: err?.meta?.target as string || '',
        message: 'This field must be unique',
      },
    ];
  } else if (err?.code === 'P2003') {
    // Prisma Foreign Key Constraint Error
    statusCode = 400;
    message = 'Foreign Key Constraint Failed';
    errorSources = [
      {
        path: err?.meta?.field_name as string || '',
        message: 'Related record not found',
      },
    ];
  } else if (err?.code === 'P2025') {
    // Prisma Not Found Error
    statusCode = 404;
    message = 'Resource Not Found';
    errorSources = [
      {
        path: '',
        message: (err.meta?.cause as string) || 'Record to update not found',
      },
    ];
  } else if (err?.name === 'PrismaClientValidationError') {
    // Prisma Invalid Data Type Error
    statusCode = 400;
    message = 'Validation Error';
    errorSources = [
      {
        path: '',
        message: 'Invalid data provided to the database',
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
};

export default globalErrorHandler;
