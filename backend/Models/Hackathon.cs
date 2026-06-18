using System.ComponentModel.DataAnnotations;

namespace HackathonPlatform.Models;

public class Hackathon
{
    public int Id { get; set; }
    
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Description { get; set; } = string.Empty;
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    public string Status { get; set; } = "Upcoming"; 
    
    public int OrganizerId { get; set; }
    public User Organizer { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Team> Teams { get; set; } = new List<Team>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}