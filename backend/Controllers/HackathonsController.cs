using System.Security.Claims;
using HackathonPlatform.Data;
using HackathonPlatform.DTOs;
using HackathonPlatform.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HackathonPlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HackathonsController : ControllerBase
{
    private readonly AppDbContext _db;
    
    public HackathonsController(AppDbContext db) => _db = db;
    
    private int GetUserId() 
    {
        var userIdStr = User.FindFirstValue("UserId");
        return int.TryParse(userIdStr, out int id) ? id : 0;
    }
    
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Hackathons
            .Include(h => h.Organizer)
            .Include(h => h.Teams)
            .OrderByDescending(h => h.StartDate)
            .Select(h => new HackathonDto(
                h.Id, h.Title, h.Description, h.StartDate, h.EndDate,
                h.Status, h.Organizer.FullName, h.Teams.Count, h.CreatedAt))
            .ToListAsync();
        return Ok(list);
    }
    
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var h = await _db.Hackathons
            .Include(x => x.Organizer)
            .Include(x => x.Teams).ThenInclude(t => t.Captain)
            .Include(x => x.Teams).ThenInclude(t => t.Members).ThenInclude(m => m.User)
            .Include(x => x.Submissions).ThenInclude(s => s.Team)
            .FirstOrDefaultAsync(x => x.Id == id);
            
        if (h == null) return NotFound();

        var currentUserId = GetUserId();
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        IEnumerable<Submission> visibleSubmissions = new List<Submission>();

        if (currentUserId > 0)
        {
            if (h.OrganizerId == currentUserId || userRole == "Admin")
            {
                visibleSubmissions = h.Submissions;
            }
            else
            {
                var userTeamIds = h.Teams
                    .Where(t => t.Members.Any(m => m.UserId == currentUserId && m.Status == "Approved"))
                    .Select(t => t.Id)
                    .ToList();

                visibleSubmissions = h.Submissions.Where(s => userTeamIds.Contains(s.TeamId)).ToList();
            }
        }

        return Ok(new
        {
            h.Id, h.Title, h.Description, h.StartDate, h.EndDate, h.Status,
            OrganizerId = h.OrganizerId,
            Organizer = new { h.Organizer.Id, h.Organizer.FullName, h.Organizer.Email },
            Teams = h.Teams.Select(t => new
            {
                t.Id, t.Name, t.Description,
                Captain = t.Captain.FullName,
                CaptainId = t.CaptainId,
                Members = t.Members.Where(m => m.Status == "Approved").Select(m => new { m.User.Id, m.User.FullName }).ToList(),
                PendingRequests = t.Members.Where(m => m.Status == "Pending").Select(m => new { m.User.Id, m.User.FullName }).ToList()
            }),
            Submissions = visibleSubmissions.Select(s => new
            {
                s.Id, s.TeamId, TeamName = s.Team.Name,
                s.FileName, s.Description, s.RepositoryUrl, s.SubmittedAt
            })
        });
    }
    
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHackathonDto dto)
    {
        var userId = GetUserId();
        var h = new Hackathon
        {
            Title = dto.Title,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            OrganizerId = userId,
            Status = DateTime.UtcNow < dto.StartDate ? "Upcoming" : "Active"
        };
        _db.Hackathons.Add(h);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = h.Id }, h);
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var h = await _db.Hackathons.FindAsync(id);
        if (h == null) return NotFound();
        
        if (h.OrganizerId != userId)
            return Forbid("Только организатор может удалить этот хакатон");
            
        _db.Hackathons.Remove(h);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}