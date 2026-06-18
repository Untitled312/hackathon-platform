using System.ComponentModel.DataAnnotations;

namespace HackathonPlatform.Models;

public class Submission
{
    public int Id { get; set; }
    
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;
    
    public int HackathonId { get; set; }
    public Hackathon Hackathon { get; set; } = null!;
    
    [Required]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    public string FilePath { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public string? RepositoryUrl { get; set; }
    
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}