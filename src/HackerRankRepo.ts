import * as TE from 'fp-ts/TaskEither'
import * as NEA from 'fp-ts/NonEmptyArray'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as ROA from 'fp-ts/ReadonlyArray'
import * as B from 'fp-ts/boolean'
import * as TK from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import * as D from 'fp-ts-std/Date'
import { pipe, hole, identity } from 'fp-ts/function'
import * as T from './type'
import axios from 'axios'

type HackerRankTest = {
  id: string
  unique_id: string
  name: string
  duration: number
  owner: string
}

type HackerRankTestData = {
  data: [HackerRankTest]
}

/**
 * TODO - Given this is a bulk query API, thus the implementation ignore the possibility of having an HTTP status code 404.
 * HTTP status code 500?
 * @param config - the API key and HackerRank API url
 * @returns Ether a HackerRankReport error or an array of Test data
 */
export const listAllTests: (config: T.HackerRankSvcConfig) => TE.TaskEither<T.HackerRankRepoError, NEA.NonEmptyArray<T.Test>> = (config) =>
  pipe(
    TE.tryCatch(
      () =>
        axios.get<HackerRankTestData>(`${T.fromHackerRankSvc(config.svc)}/x/api/v3/tests?limit=100&offset=0`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${config.key}`,
          },
        }),
      (e) => T.networkErrorOf(JSON.stringify(e, null, 2))
    ),
    TE.flatMap((r) =>
      pipe(
        r.data.data,
        TE.traverseArray((a) =>
          pipe(
            O.of(T.testOf),
            O.ap(T.testIdOf(a.id)),
            O.ap(T.testNameOf(a.name)),
            TE.fromOption(() => T.NoRequiredData)
          )
        ),
        TE.flatMap((a) =>
          pipe(
            NEA.fromArray(ROA.toArray(a)),
            TE.fromOption(() => T.NoTestFound)
          )
        )
      )
    )
  )

type CandidateTestRecord = {
  id: string
  email: string
  full_name: string
  score: number
  attempt_endtime: string
  status: number
  plagiarism_status: boolean
}
type CandidateData = { data: [CandidateTestRecord] }

const b2PlagiarismStatus: (b: boolean) => T.PlagiarismStatus = (b) =>
  B.fold(
    () => T.Clean,
    () => T.Suspected
  )(b)

const _findCandidate: (
  config: T.HackerRankSvcConfig
) => (candidateEmail: T.CandidateEmail) => (test: T.Test) => TE.TaskEither<T.HackerRankRepoError, T.Candidate> =
  (config) => (candidateEmail) => (test) =>
    pipe(
      TE.tryCatch(
        () =>
          axios.get<CandidateData>(
            `${T.fromHackerRankSvc(config.svc)}/x/api/v3/tests/${T.fromTestId(test.testId)}/candidates/search?search=${T.fromCandidateEmail(
              candidateEmail
            )}&limit=10&offset=0`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${config.key}`,
              },
            }
          ),
        (e) => T.networkErrorOf(JSON.stringify(e, null, 2))
      ),
      TE.flatMap((a) => {
        const records = a.data.data

        return pipe(
          A.isNonEmpty(records),
          B.fold(
            () => TE.left(T.noCandidateFound(test.testId)(candidateEmail)),
            () => {
              const h = records[0]
              const candidateId = T.candidateIdOf(h.id)
              const candidateName = T.fullNameOf(h.full_name)
              const testRecords = pipe(
                NEA.fromArray(records),
                O.map((na) =>
                  pipe(
                    na,
                    NEA.map((y) =>
                      T.testRecordOf(test.testId)(test.testName)(b2PlagiarismStatus(y.plagiarism_status))(
                        T.attemptTimeOf(D.unsafeParseDate(y.attempt_endtime))
                      )(T.testScoreOf(y.score))
                    )
                  )
                )
              )

              return pipe(
                O.of(T.candidateOf),
                O.ap(candidateId),
                O.ap(candidateName),
                O.ap(O.of(candidateEmail)),
                O.ap(testRecords),
                TE.fromOption(() => T.noCandidateFound(test.testId)(candidateEmail))
              )
            }
          )
        )
      })
    )

const _rec =
  (config: T.HackerRankSvcConfig, tests: Array<T.Test>, candidateEmail: T.CandidateEmail): TK.Task<T.Candidate | undefined> =>
  async () => {
    let r: T.Candidate | undefined

    const _fc = _findCandidate(config)(candidateEmail)

    for (let t of tests) {
      let x = await pipe(
        _fc(t),
        TE.match((e) => {
          // DEBUG
          console.error(JSON.stringify(e, null, 2))

          return undefined
        }, identity)
      )()

      if (x !== undefined)
        r = { id: x.id, fullName: x.fullName, email: x.email, records: r !== undefined ? NEA.concat(x.records)(r.records) : x.records }
    }

    return r
  }

export const findCandidate: (
  config: T.HackerRankSvcConfig
) => (tests: Array<T.Test>) => (candidateEmail: T.CandidateEmail) => TE.TaskEither<T.HackerRankRepoError, T.Candidate> =
  (config) => (tests) => (candidateEmail) =>
    pipe(
      _rec(config, tests, candidateEmail),
      TK.map((x) =>
        x === undefined
          ? E.left(
              T.noFinalCandidateFound(
                pipe(
                  tests,
                  A.map((_) => _.testId)
                )
              )(candidateEmail)
            )
          : E.right(x)
      )
    )

export const pdfReportBy: (
  config: T.HackerRankSvcConfig
) => (testId: T.TestId) => (candidateId: T.CandidateId) => TE.TaskEither<T.HackerRankRepoError, T.PDFUrl> =
  (config) => (testId) => (candidateId) =>
    pipe(
      TE.tryCatch(
        () =>
          axios.get<string>(
            `${T.fromHackerRankSvc(config.svc)}/x/api/v3/tests/${T.fromTestId(testId)}/candidates/${T.fromCandidateId(
              candidateId
            )}/pdf?format=url`,
            {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${config.key}`,
              },
            }
          ),
        (e) => T.networkErrorOf(JSON.stringify(e, null, 2))
      ),
      TE.flatMap(x => TE.fromOption(() => T.noPDFUrl(testId)(candidateId))(T.pdfUrlOf(x.data)))
    )
