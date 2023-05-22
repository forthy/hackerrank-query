# Domain Model

```haskell
data CandidateEmail = CandidateEmail String
data CandidateId = CandidateId String
data FullName = FullName String
data TestId = TestId String
data UniqueTestId = UniqueTestId String
data TestName = TestName String
data TestScore = TestScore Float
data TestStatus = Invited | Completed
data PDFUrl = PDFUrl String
data PlagiarismStatus = Suspected | Clean
data Test = TestId TestName
data AttemptTime = AttemptTime DateTime
data TestRecord = TestId TestName PlagiarismStatus AttemptTime TestScore
data Candidate = CandidateId FullName CandidateEmail [TestRecord]
data HackerRankSvc = HackerRankSvc String
data APIKey = APIKey String
data HackerRankSvcConfig = APIKey HackerRankSvc
data HackerRankRepoError = ListTestsError | FindCandidateError | NetworkError
data DownLoadUrl = DownloadUrl String

listAllTests :: HackerRankSvcConfig -> Either HackerRankRepoError [Test]
findCandidate :: HackerRankSvcConfig -> [Test] -> CandidateEmail -> Either HackerRankRepoError Candidate
pdfReportBy :: HackerRankSvcConfig -> TestId -> CandidateId -> Either HackerRankRepoError PDFUrl
```
