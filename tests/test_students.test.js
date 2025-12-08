const request = require('supertest');
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';

const { app, sequelize, Student } = require('../index');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

test('creates a student, lists students and records a payment', async () => {
  const newStudent = { name: 'Alice', fees: 1000 };
  const postRes = await request(app).post('/student').send(newStudent);
  expect(postRes.statusCode).toBe(201);
  expect(postRes.body.name).toBe('Alice');

  const listRes = await request(app).get('/students');
  expect(listRes.statusCode).toBe(200);
  expect(Array.isArray(listRes.body)).toBe(true);
  expect(listRes.body.length).toBe(1);

  const id = postRes.body.id;
  const payRes = await request(app).put(`/student/${id}/pay`).send({ amount: 200 });
  expect(payRes.statusCode).toBe(200);
  expect(payRes.body.feePaid).toBe(200);
});
