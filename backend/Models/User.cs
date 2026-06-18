using System.ComponentModel.DataAnnotations;

namespace HackathonPlatform.Models;

public class User
{
    public int Id { get; set; }
    
    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;
    
    public string Role { get; set; } = "Participant";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
    public ICollection<Team> CaptainedTeams { get; set; } = new List<Team>();
}