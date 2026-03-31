import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(ApiError.badRequest('Validation failed', errors));
  }

  req.body = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query) {
    // Express 5: req.query is read-only, so merge parsed values onto it
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, result.data.query);
  }

  next();
};

export default validate;
