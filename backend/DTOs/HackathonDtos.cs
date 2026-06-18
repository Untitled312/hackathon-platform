using System.ComponentModel.DataAnnotations;

namespace HackathonPlatform.DTOs;

public record CreateHackathonDto(
    [Required, MaxLength(200)] string Title,
    [Required] string Description,
    [Required] DateTime StartDate,
    [Required] DateTime EndDate
);

public record HackathonDto(
    int Id,
    string Title,
    string Description,
    DateTime StartDate,
    DateTime EndDate,
    string Status,
    string OrganizerName,
    int TeamsCount,
    DateTime CreatedAt
);