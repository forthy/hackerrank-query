import { Newtype, prism, iso } from 'newtype-ts'
import * as O from 'fp-ts/Option'
import * as A from 'fp-ts/Apply'
import * as P from 'fp-ts/Predicate'
import * as NEA from 'fp-ts/NonEmptyArray'
import * as C from './config'
import { pipe } from 'fp-ts/function'

const isNonEmptyString: P.Predicate<string> = (str) => str !== ''
const emailRegEx: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const isEmailString: P.Predicate<string> = (m) => emailRegEx.test(m)

export interface TestId extends Newtype<{ readonly TestId: unique symbol }, string> {}
const prismTestId = prism<TestId>(isNonEmptyString)
const isoTestId = iso<TestId>()
export const testIdOf: (id: string) => O.Option<TestId> = (id) => prismTestId.getOption(id)
export const fromTestId: (id: TestId) => string = (id) => prismTestId.reverseGet(id)
export const unsafeTestIdOf: (id: string) => TestId = (id) => isoTestId.wrap(id)

export interface TestName extends Newtype<{ readonly TestName: unique symbol }, string> {}
const prismTestName = prism<TestName>(isNonEmptyString)
const isoTestName = iso<TestName>()
export const testNameOf: (name: string) => O.Option<TestName> = (name) => prismTestName.getOption(name)
export const fromTestName: (name: TestName) => string = (name) => prismTestName.reverseGet(name)
export const unsafeTestNameOf: (name: string) => TestName = (name) => isoTestName.wrap(name)

export type Test = Readonly<{ testId: TestId; testName: TestName }>
export const testOf: (id: TestId) => (name: TestName) => Test = (testId) => (testName) => ({ testId, testName })

export interface TestScore extends Newtype<{ readonly TestScore: unique symbol }, number> {}
const isoTestScore = iso<TestScore>()
export const testScoreOf: (s: number) => TestScore = (s) => isoTestScore.wrap(s)
export const fromTestScore: (s: TestScore) => number = (s) => isoTestScore.unwrap(s)

export interface CandidateEmail extends Newtype<{ readonly CandidateEmail: unique symbol }, string> {}
const isoCandidateEmail = iso<CandidateEmail>()
const prismCandidateEmail = prism<CandidateEmail>(P.and(isEmailString)(isNonEmptyString))
export const candidateEmailOf: (m: string) => O.Option<CandidateEmail> = (m) => prismCandidateEmail.getOption(m)
export const fromCandidateEmail: (m: CandidateEmail) => string = (m) => prismCandidateEmail.reverseGet(m)
export const unsafeCandidateEmailOf: (m: string) => CandidateEmail = (m) => isoCandidateEmail.wrap(m)

export interface CandidateId extends Newtype<{ readonly CandidateId: unique symbol }, string> {}
const isoCandidateId = iso<CandidateId>()
const prismCandidateId = prism<CandidateId>(isNonEmptyString)
export const candidateIdOf: (id: string) => O.Option<CandidateId> = (id) => prismCandidateId.getOption(id)
export const fromCandidateId: (id: CandidateId) => string = (id) => prismCandidateId.reverseGet(id)
export const unsafeCandidateIdOf: (id: string) => CandidateId = (id) => isoCandidateId.wrap(id)

export interface FullName extends Newtype<{ readonly FullName: unique symbol }, string> {}
const isoFullName = iso<FullName>()
const prismFullName = prism<FullName>(isNonEmptyString)
export const fullNameOf: (n: string) => O.Option<FullName> = (n) => prismFullName.getOption(n)
export const fromFullName: (n: FullName) => string = (n) => prismFullName.reverseGet(n)
export const unsafeFullNameOf: (n: string) => FullName = (n) => isoFullName.wrap(n)

export type Candidate = Readonly<{ id: CandidateId; fullName: FullName; email: CandidateEmail; records: NEA.NonEmptyArray<TestRecord> }>
export const candidateOf: (
  id: CandidateId
) => (fullName: FullName) => (email: CandidateEmail) => (records: NEA.NonEmptyArray<TestRecord>) => Candidate =
  (id) => (fullName) => (email) => (records) => ({ id, fullName, email, records })

export const Suspected = { _tag: 'Suspected' }
export const Clean = { _tag: 'Clean' }
export type PlagiarismStatus = typeof Suspected | typeof Clean

export interface AttemptTime extends Newtype<{ readonly AttemptTime: unique symbol }, Date> {}
const isoAttemptTime = iso<AttemptTime>()
export const attemptTimeOf: (d: Date) => AttemptTime = (d) => isoAttemptTime.wrap(d)
export const fromAttemptTime: (d: AttemptTime) => Date = (d) => isoAttemptTime.unwrap(d)

export type TestRecord = Readonly<{
  id: TestId
  name: TestName
  plagiarismStatus: PlagiarismStatus
  attemptTime: AttemptTime
  score: TestScore
}>
export const testRecordOf: (
  id: TestId
) => (name: TestName) => (plagiarismStatus: PlagiarismStatus) => (attemptTime: AttemptTime) => (score: TestScore) => TestRecord =
  (id) => (name) => (plagiarismStatus) => (attemptTime) => (score) => ({ id, name, plagiarismStatus, attemptTime, score })

export interface HackerRankSvc extends Newtype<{ readonly HackerRankSvc: unique symbol }, string> {}
const prismHackerRankSvc = prism<HackerRankSvc>(isNonEmptyString)
export const hackerRankSvcOf: (svc: string) => O.Option<HackerRankSvc> = (svc) => prismHackerRankSvc.getOption(svc)
export const fromHackerRankSvc: (svc: HackerRankSvc) => string = (svc) => prismHackerRankSvc.reverseGet(svc)

export interface APIKey extends Newtype<{ readonly APIKey: unique symbol }, string> {}
const prismAPIKey = prism<APIKey>(isNonEmptyString)
export const apiKeyOf: (key: string) => O.Option<APIKey> = (key) => prismAPIKey.getOption(key)
export const fromAPIKey: (key: APIKey) => string = (key) => prismAPIKey.reverseGet(key)

// Error
export type ListTestsError = Readonly<{ _tag: 'ListTestsError'; msg: string }>
export const NoTestFound: ListTestsError = { _tag: 'ListTestsError', msg: 'Failed to find any test when listing all tests.' }
export const NoRequiredData: ListTestsError = { _tag: 'ListTestsError', msg: 'Neither test ID nor test name is available' }
export type FindCandidateError = Readonly<{ _tag: 'FindCandidateError'; msg: string }>
export const noCandidateFound: (testId: TestId) => (candidateEmail: CandidateEmail) => FindCandidateError =
  (testId) => (candidateEmail) => ({
    _tag: 'FindCandidateError',
    msg: `Failed to find any candidate with test ID: [${testId}] and email: [${candidateEmail}]`,
  })
export const noFinalCandidateFound: (testIds: Array<TestId>) => (candidateEmail: CandidateEmail) => FindCandidateError =
  (testIds) => (candidateEmailOf) => ({
    _tag: 'FindCandidateError',
    msg: `Failed to find any candidate with all test Ids: [${JSON.stringify(testIds)}] and email: [${candidateEmailOf}]`,
  })
export type NetworkError = Readonly<{ _tag: 'NetworkError'; msg: string }>
export type HackerRankRepoError = ListTestsError | FindCandidateError | NetworkError

export const networkErrorOf: (msg: string) => NetworkError = (msg) => ({ _tag: 'NetworkError', msg })

// Config
export type HackerRankSvcConfig = Readonly<{ key: APIKey; svc: HackerRankSvc }>
export const hackerRankSvcConfig: O.Option<HackerRankSvcConfig> = A.sequenceS(O.Apply)({
  key: pipe(C.apiKey, O.flatMap(apiKeyOf)),
  svc: pipe(C.apiKey, O.flatMap(hackerRankSvcOf)),
})
