using System.ComponentModel.DataAnnotations;

namespace HackathonPlatform.DTOs;

public record CreateTeamDto(
    [Required, MaxLength(100)] string Name,
    string? Description,
    [Required] int HackathonId
);

public record JoinTeamDto([Required] int TeamId);

public record TeamDto(
    int Id,
    string Name,
    string? Description,
    int HackathonId,
    string HackathonTitle,
    string CaptainName,
    List<TeamMemberDto> Members,
    DateTime CreatedAt
);

public record TeamMemberDto(int UserId, string FullName, string Email, DateTime JoinedAt);