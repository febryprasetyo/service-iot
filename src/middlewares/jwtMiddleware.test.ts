jest.mock('../utils/util', () => ({
  isValidateToken: jest.fn(),
  decodeToken: jest.fn(),
  logger: { error: jest.fn() }
}));

import { Request, Response } from 'express';
import { decodeToken, isValidateToken } from '../utils/util';
import { CALIBRATION_AUTH_MESSAGES } from '../helpers/CalibrationApiContract';
import { JwtMiddleware } from './jwtMiddleware';

const mockedIsValidateToken = isValidateToken as jest.MockedFunction<typeof isValidateToken>;
const mockedDecodeToken = decodeToken as jest.MockedFunction<typeof decodeToken>;

function responseDouble(): Response {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
}

describe('JwtMiddleware calibration message overrides', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an Indonesian invalid-token error for a missing calibration token', async () => {
    const response = responseDouble();
    const next = jest.fn();

    await JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES)(
      { headers: {}, body: {} } as Request,
      response,
      next
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ success: false, message: 'Token akses tidak valid.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns an Indonesian expired-token error while preserving HTTP 401', async () => {
    mockedIsValidateToken.mockReturnValue(false);
    const response = responseDouble();

    await JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES)(
      { headers: { authorization: 'Bearer expired' }, body: {} } as Request,
      response,
      jest.fn()
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token akses telah kedaluwarsa atau tidak valid.'
    });
  });

  it('returns an Indonesian access-denied error for a valid role outside the calibration allowlist', async () => {
    mockedIsValidateToken.mockReturnValue(true);
    mockedDecodeToken.mockReturnValue({ userData: { user_id: 7, role_id: 'usr' } } as any);
    const response = responseDouble();

    await JwtMiddleware('adm:eng', CALIBRATION_AUTH_MESSAGES)(
      { headers: { authorization: 'Bearer valid' }, body: {} } as Request,
      response,
      jest.fn()
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Anda tidak memiliki izin untuk mengakses endpoint kalibrasi ini.'
    });
  });
});
