using System.ComponentModel.DataAnnotations;

namespace HackathonPlatform.DTOs;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MaxLength(100)] string FullName
);

public record LoginDto([Required, EmailAddress] string Email, [Required] string Password);

public record AuthResponseDto(string Token, int UserId, string Email, string FullName, string Role);