const mockDb: any = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockWhereRaw = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../utils/util', () => {
  const mockDbFactory: any = jest.fn();
  mockDbFactory.raw = jest.fn((value: any) => value);
  mockDbFactory.select = mockSelect;
  mockDbFactory.mockImplementation(() => mockDbFactory.userTable);

  return {
    logger: { error: jest.fn() },
    sendResponseCustom: jest.fn((res: any, data: any, statusCode = 200) => {
      res.status(statusCode).json({ success: true, ...data });
    }),
    sendResponseError: jest.fn((res: any, error: any) => {
      res.status(400).json({ success: false, message: error.message });
    }),
    errorCodes: {},
    createError: (message: string, code = 'E_BAD_REQUEST', detail: any = null) => {
      const error: any = new Error(message);
      error.code = code;
      error.detail = detail;
      return error;
    },
    validateParamsAll: jest.fn(),
    db: mockDbFactory,
    moment: jest.fn(),
    buildPagination: jest.fn(),
  };
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import bcrypt from 'bcryptjs';
import DataClientController = require('./DataClientController');
import { validateParamsAll, db } from '../utils/util';

const mockedValidateParamsAll = validateParamsAll as jest.MockedFunction<typeof validateParamsAll>;
const mockedDb = db as jest.MockedFunction<typeof db>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function responseDouble() {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
}

describe('DataClientController user management', () => {
  let controller: any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DataClientController();

    mockInsert.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockWhereRaw.mockReturnValue({ update: mockUpdate });
    mockedDb.mockImplementation(() => ({
      insert: mockInsert,
      whereRaw: mockWhereRaw,
      update: mockUpdate,
    }));
    mockedValidateParamsAll.mockResolvedValue({ failed: false, message_en: '', message_id: '' } as any);
    (mockedBcrypt.compare as any).mockResolvedValue(true);
  });

  it('allows engineering users to be created without api credentials', async () => {
    mockSelect
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          whereRaw: jest.fn().mockResolvedValue([{ id: 'eng' }]),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          whereRaw: jest.fn().mockResolvedValue([]),
        })),
      }));
    const response = responseDouble();

    await controller.handleCreateUser(
      {
        body: {
          username: 'eng-user',
          password: 'secret123',
          nama_dinas: 'Internal',
          role_id: 'eng',
          user_id: 7,
        },
      },
      response
    );

    expect(mockedValidateParamsAll).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'eng-user',
        nama_dinas: 'Internal',
        role_id: 'eng',
        user_id: 7,
      }),
      expect.objectContaining({
        api_key: 'string',
        secret_key: 'string',
      })
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'eng-user',
        api_key: '',
        secret_key: '',
        role_id: 'eng',
      })
    );
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('requires api credentials for user accounts', async () => {
    mockSelect
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          whereRaw: jest.fn().mockResolvedValue([{ id: 'usr' }]),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: jest.fn(() => ({
          whereRaw: jest.fn().mockResolvedValue([]),
        })),
      }));
    const response = responseDouble();

    await controller.handleCreateUser(
      {
        body: {
          username: 'usr-user',
          password: 'secret123',
          nama_dinas: 'Cabang',
        },
      },
      response
    );

    expect(mockedValidateParamsAll).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'usr-user',
        nama_dinas: 'Cabang',
      }),
      expect.objectContaining({
        api_key: 'required',
        secret_key: 'required',
      })
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        role_id: 'usr',
      })
    );
  });

  it('uses the stored role when updating an engineering account without api credentials', async () => {
    mockSelect.mockImplementationOnce(() => ({
      from: jest.fn(() => ({
        whereRaw: jest.fn().mockResolvedValue([
          {
            id: 11,
            username: 'existing-user',
            password: 'existing-hash',
            role_id: 'eng',
            nama_dinas: 'Internal',
            api_key: '',
            secret_key: '',
          },
        ]),
      })),
    }));
    const response = responseDouble();

    await controller.handleUpdateUser(
      {
        body: {
          id: 11,
          username: 'existing-user',
          password: 'existing-password',
          nama_dinas: 'Internal',
        },
      },
      response
    );

    expect(mockedValidateParamsAll).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 11,
        username: 'existing-user',
        nama_dinas: 'Internal',
      }),
      expect.objectContaining({
        api_key: 'string',
        secret_key: 'string',
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'existing-user',
        api_key: '',
        secret_key: '',
        role_id: 'eng',
      })
    );
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
