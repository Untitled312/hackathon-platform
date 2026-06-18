namespace HackathonPlatform.DTOs;

public record SubmissionDto(
    int Id,
    int TeamId,
    string TeamName,
    int HackathonId,
    string HackathonTitle,
    string FileName,
    string? Description,
    string? RepositoryUrl,
    DateTime SubmittedAt
);