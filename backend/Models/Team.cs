using System.ComponentModel.DataAnnotations;

namespace HackathonPlatform.Models;

public class Team
{
    public int Id { get; set; }
    
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public int HackathonId { get; set; }
    public Hackathon Hackathon { get; set; } = null!;
    
    public int CaptainId { get; set; }
    public User Captain { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}

public class TeamMember
{
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    public string Status { get; set; } = "Pending"; 
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}