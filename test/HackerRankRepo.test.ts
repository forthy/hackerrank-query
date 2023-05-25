import { afterAll, beforeAll, expect, describe, it } from 'vitest'
import * as HRR from '../src/HackerRankRepo'
import * as C from '../src/config'
import * as T from '../src/type'
import * as TA from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import * as A from 'fp-ts/Apply'
import * as NEA from 'fp-ts/NonEmptyArray'
import { identity, pipe, hole } from 'fp-ts/function'
import * as D from 'fp-ts-std/Date'
import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { fail } from 'assert'
import { WireMock, IWireMockRequest, IWireMockResponse } from 'wiremock-captain'

const runBlock: (ms: number) => (fn: () => void) => TA.Task<void> = (ms) => (fn) => {
  fn()
  return () => new Promise((r) => setTimeout(r, ms))
}

const expectedTestsList: NEA.NonEmptyArray<T.Test> = pipe(
  NEA.of({ testId: T.unsafeTestIdOf('799685'), testName: T.unsafeTestNameOf('Test 1') }),
  NEA.concat([
    { testId: T.unsafeTestIdOf('796107'), testName: T.unsafeTestNameOf('Test 2') },
    { testId: T.unsafeTestIdOf('754562'), testName: T.unsafeTestNameOf('Test 3') },
  ])
)

describe('HackerRankRepo should', () => {
  let wireMockContainer: StartedTestContainer

  beforeAll(async () => {
    wireMockContainer = await new GenericContainer('wiremock/wiremock:2.35.0').withName('wiremock').withExposedPorts(8080).start()
  }, 120000)

  it('list all tests', async () => {
    const wiremockEndpoint = `http://${wireMockContainer.getHost()}:${wireMockContainer.getMappedPort(8080)}`
    const fn = () => {
      const config: O.Option<T.HackerRankSvcConfig> = A.sequenceS(O.Apply)({
        key: pipe(C.apiKey, O.flatMap(T.apiKeyOf)),
        svc: pipe(O.some(wiremockEndpoint), O.flatMap(T.hackerRankSvcOf)),
      })

      pipe(
        config,
        O.map(async (c) => {
          const stub = new WireMock(wiremockEndpoint)

          const request: IWireMockRequest = {
            method: 'GET',
            endpoint: '/x/api/v3/tests?limit=100&offset=0',
            headers: { Authorization: `Bearer ${c.key}` },
          }
          const stubbedResponse: IWireMockResponse = {
            status: 200,
            body: {
              data: [
                {
                  id: '799685',
                  unique_id: 'ejgbkq83t01',
                  name: 'Test 1',
                  duration: 90,
                  owner: '324512',
                  instructions: 'instruction 1',
                  created_at: '2020-05-25T06:33:07+0000',
                  state: 'active',
                  locked: false,
                  test_type: 'regular',
                  starred: true,
                  start_time: null,
                  end_time: null,
                  draft: false,
                  questions: ['1010687', '308309', '200934'],
                  sections: null,
                  tags: ['Software Engineer'],
                  permission: 3,
                },
                {
                  id: '796107',
                  unique_id: '1mrgchj443g',
                  name: 'Test 2',
                  duration: 90,
                  owner: '324512',
                  instructions: 'Instruction 2',
                  created_at: '2020-05-18T10:10:01+0000',
                  state: 'active',
                  locked: false,
                  test_type: 'regular',
                  starred: true,
                  start_time: null,
                  end_time: null,
                  draft: false,
                  questions: ['348983', '466924', '212364', '480206', '1010799', '304751', '1230100'],
                  sections: null,
                  tags: ['Software Engineer'],
                  permission: 3,
                },
                {
                  id: '754562',
                  unique_id: 'a8e1jhrqrg7',
                  name: 'Test 3',
                  duration: 90,
                  owner: '324512',
                  instructions: 'Instruction 3',
                  created_at: '2020-03-30T08:24:56+0000',
                  state: 'active',
                  locked: false,
                  test_type: 'regular',
                  starred: true,
                  start_time: null,
                  end_time: null,
                  draft: false,
                  questions: ['558376', '757894', '622558', '1182112', '568819', '1185505', '1089208'],
                  sections: null,
                  tags: ['Software Engineer'],
                  permission: 3,
                },
              ],
              page_total: 1,
              offset: 10,
              previous: `https://localhost:8080/x/api/v3/tests?offset=0&limit=100`,
              next: '',
              first: `https://localhost:8080/x/api/v3/tests?offset=0&limit=100`,
              last: `https://localhost:8080/x/api/v3/tests?offset=1&limit=100`,
              total: 3,
            },
          }

          await pipe(
            TE.tryCatch(
              () => stub.register(request, stubbedResponse),
              (e) => T.networkErrorOf(`${JSON.stringify(e, null, 2)}`)
            ),
            TE.flatMap((_) => HRR.listAllTests(c)),
            TE.match(
              (e) => fail(e.msg),
              (t) => {
                expect(t.length).toBe(3)
                expect(t).toStrictEqual(expectedTestsList)
              }
            )
          )()
        }),
        O.match(() => fail('No configuration given!'), identity)
      )
    }

    await runBlock(3000)(fn)()
  })

  it('search a candidate', async () => {
    const testId = '754562'
    const testName = 'Test 1'
    const candidateEmail = 'candidatea@mailservice.com'
    const cem = T.unsafeCandidateEmailOf(candidateEmail)
    const tests = [
      T.testOf(T.unsafeTestIdOf('261732'))(T.unsafeTestNameOf('Test 3')),
      T.testOf(T.unsafeTestIdOf('not-the-id'))(T.unsafeTestNameOf('Test 2')),
      T.testOf(T.unsafeTestIdOf(testId))(T.unsafeTestNameOf(testName)),
    ]
    const wiremockEndpoint = `http://${wireMockContainer.getHost()}:${wireMockContainer.getMappedPort(8080)}`

    const fn = () => {
      const config: O.Option<T.HackerRankSvcConfig> = A.sequenceS(O.Apply)({
        key: pipe(C.apiKey, O.flatMap(T.apiKeyOf)),
        svc: pipe(O.some(wiremockEndpoint), O.flatMap(T.hackerRankSvcOf)),
      })

      pipe(
        config,
        O.map(async (c) => {
          const stub = new WireMock(wiremockEndpoint)

          const request: IWireMockRequest = {
            method: 'GET',
            endpoint: `/x/api/v3/tests/${testId}/candidates/search?search=${candidateEmail}&limit=10&offset=0`,
            headers: { Authorization: `Bearer ${c.key}` },
          }
          const stubbedResponse: IWireMockResponse = {
            status: 200,
            body: {
              data: [
                {
                  id: '18119687',
                  email: candidateEmail,
                  full_name: 'John Doe',
                  score: 99,
                  attempt_endtime: '2020-05-02T13:07:46+0000',
                  status: 7,
                  plagiarism_status: true,
                },
                {
                  id: '18119687',
                  email: candidateEmail,
                  full_name: 'John Doe',
                  score: 137,
                  attempt_endtime: '2020-06-04T13:07:46+0000',
                  status: 7,
                  plagiarism_status: false,
                },
              ],
              page_total: 1,
              offset: 0,
              previous: '',
              next: '',
              first: `${wiremockEndpoint}/x/api/v3/tests/${testId}/candidates/search?offset=0&limit=10&search=${candidateEmail}`,
              last: `${wiremockEndpoint}/x/api/v3/tests/${testId}/candidates/search?offset=0&limit=10&search=${candidateEmail}`,
              total: 1,
            },
          }

          await pipe(
            TE.tryCatch(
              () => stub.register(request, stubbedResponse),
              (e) => T.networkErrorOf(`${JSON.stringify(e, null, 2)}`)
            ),
            TE.flatMap((_) =>
              TE.tryCatch(
                () =>
                  stub.register(
                    {
                      method: 'GET',
                      endpoint: `/x/api/v3/tests/not-the-id/candidates/search?search=${candidateEmail}&limit=10&offset=0`,
                      headers: { Authorization: `Bearer ${c.key}` },
                    },
                    {
                      status: 200,
                      body: {
                        data: [],
                        page_total: 0,
                        offset: 0,
                        previous: '',
                        next: '',
                        first: `${wiremockEndpoint}/x/api/v3/tests/not-the-id/candidates/search?offset=0&limit=10&search=${candidateEmail}`,
                        last: `${wiremockEndpoint}/x/api/v3/tests/not-the-id/candidates/search?offset=-100&limit=10&search=${candidateEmail}`,
                        total: 0,
                      },
                    }
                  ),
                (e) => T.networkErrorOf(`${JSON.stringify(e, null, 2)}`)
              )
            ),
            TE.flatMap((_) =>
              TE.tryCatch(
                () =>
                  stub.register(
                    {
                      method: 'GET',
                      endpoint: `/x/api/v3/tests/261732/candidates/search?search=${candidateEmail}&limit=10&offset=0`,
                      headers: { Authorization: `Bearer ${c.key}` },
                    },
                    {
                      status: 200,
                      body: {
                        data: [
                          {
                            id: '18119687',
                            email: candidateEmail,
                            full_name: 'John Doe',
                            score: 125,
                            attempt_endtime: '2020-07-04T13:07:46+0000',
                            status: 7,
                            plagiarism_status: false,
                          },
                        ],
                        page_total: 0,
                        offset: 0,
                        previous: '',
                        next: '',
                        first: `${wiremockEndpoint}/x/api/v3/tests/261732/candidates/search?offset=0&limit=10&search=${candidateEmail}`,
                        last: `${wiremockEndpoint}/x/api/v3/tests/261732/candidates/search?offset=-100&limit=10&search=${candidateEmail}`,
                        total: 0,
                      },
                    }
                  ),
                (e) => T.networkErrorOf(`${JSON.stringify(e, null, 2)}`)
              )
            ),
            TE.flatMap((_) => HRR.findCandidate(c)(tests)(cem)),
            TE.match(
              (e) => fail(e.msg),
              (candidate) => {
                expect(candidate.id).toStrictEqual(T.unsafeCandidateIdOf('18119687'))
                expect(candidate.fullName).toStrictEqual(T.unsafeFullNameOf('John Doe'))
                expect(candidate.email).toStrictEqual(cem)
                expect(candidate.records).toStrictEqual([
                  T.testRecordOf(T.unsafeTestIdOf('261732'))(T.unsafeTestNameOf('Test 3'))(T.Clean)(
                    T.attemptTimeOf(D.unsafeParseDate('2020-07-04T13:07:46+0000'))
                  )(T.testScoreOf(125)),
                  T.testRecordOf(T.unsafeTestIdOf(testId))(T.unsafeTestNameOf(testName))(T.Suspected)(
                    T.attemptTimeOf(D.unsafeParseDate('2020-05-02T13:07:46+0000'))
                  )(T.testScoreOf(99)),
                  T.testRecordOf(T.unsafeTestIdOf(testId))(T.unsafeTestNameOf(testName))(T.Clean)(
                    T.attemptTimeOf(D.unsafeParseDate('2020-06-04T13:07:46+0000'))
                  )(T.testScoreOf(137)),
                ])
              }
            )
          )()
        }),
        O.match(() => fail('No configuration given!'), identity)
      )
    }

    await runBlock(3000)(fn)()
  })

  it(`download a candidate's PDF file`, async () => {
    const testId = '261751'
    const candidateId = '73868318'
    const wiremockEndpoint = `http://${wireMockContainer.getHost()}:${wireMockContainer.getMappedPort(8080)}`

    const fn = async () => {
      const config: O.Option<T.HackerRankSvcConfig> = A.sequenceS(O.Apply)({
        key: pipe(C.apiKey, O.flatMap(T.apiKeyOf)),
        svc: pipe(O.some(wiremockEndpoint), O.flatMap(T.hackerRankSvcOf)),
      })

      pipe(
        config,
        O.map(async (c) => {
          const stub = new WireMock(wiremockEndpoint)

          await pipe(
            TE.tryCatch(
              () =>
                stub.register(
                  {
                    method: 'GET',
                    endpoint: `/x/api/v3/tests/${testId}/candidates/${candidateId}/pdf?format=url`,
                    headers: { Authorization: `Bearer ${c.key}` },
                  },
                  {
                    status: 200,
                    body: `https://downloads.hackerrank.com/reports/${testId}/pdfs/52614834?AWSAccessKeyId=QKIAR6O9GABX5DNFO1PV&Expires=1685027152&Signature=X2vXCCJFUKJubq%2B0LqUAIXFn8pQ%3D&response-content-disposition=attachment%3B%20filename%3DReport_Test_2_432221a_mail.com.pdf&response-content-type=application%2Fpdf`,
                  }
                ),
              (e) => T.networkErrorOf(`${JSON.stringify(e, null, 2)}`)
            ),
            TE.flatMap((_) => HRR.pdfReportBy(c)(T.unsafeTestIdOf(testId))(T.unsafeCandidateIdOf(candidateId))),
            TE.match(
              (e) => fail(e.msg),
              (url) =>
                expect(T.fromPdfUrl(url)).toBe(
                  `https://downloads.hackerrank.com/reports/${testId}/pdfs/52614834?AWSAccessKeyId=QKIAR6O9GABX5DNFO1PV&Expires=1685027152&Signature=X2vXCCJFUKJubq%2B0LqUAIXFn8pQ%3D&response-content-disposition=attachment%3B%20filename%3DReport_Test_2_432221a_mail.com.pdf&response-content-type=application%2Fpdf`
                )
            )
          )()
        }),
        O.match(() => fail('No configuration given!'), identity)
      )
    }

    await runBlock(3000)(fn)()
  })

  afterAll(async () => {
    await wireMockContainer.stop()
  })
})
