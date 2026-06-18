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
public class TeamsController : ControllerBase
{
    private readonly AppDbContext _db;
    
    public TeamsController(AppDbContext db) => _db = db;
    
    private int GetUserId() 
    {
        var userIdStr = User.FindFirstValue("UserId");
        return int.TryParse(userIdStr, out int id) ? id : 0;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? hackathonId)
    {
        var query = _db.Teams
            .Include(t => t.Hackathon)
            .Include(t => t.Captain)
            .Include(t => t.Members).ThenInclude(m => m.User)
            .AsQueryable();
        
        if (hackathonId.HasValue)
            query = query.Where(t => t.HackathonId == hackathonId.Value);
        
        var teams = await query.ToListAsync();
        var result = teams.Select(t => new TeamDto(
            t.Id, t.Name, t.Description, t.HackathonId, t.Hackathon.Title,
            t.Captain.FullName,
            t.Members.Where(m => m.Status == "Approved").Select(m => new TeamMemberDto(m.UserId, m.User.FullName, m.User.Email, m.JoinedAt)).ToList(),
            t.CreatedAt
        ));
        return Ok(result);
    }
    
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTeamDto dto)
    {
        var userId = GetUserId();
        if (userId == 0) return Unauthorized();
        
        var alreadyInTeam = await _db.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.Team.HackathonId == dto.HackathonId);
        if (alreadyInTeam)
            return BadRequest(new { message = "Вы уже подали заявку или состоите в команде на этом хакатоне" });
        
        var team = new Team
        {
            Name = dto.Name,
            Description = dto.Description,
            HackathonId = dto.HackathonId,
            CaptainId = userId
        };
        _db.Teams.Add(team);
        await _db.SaveChangesAsync();
        
        _db.TeamMembers.Add(new TeamMember { TeamId = team.Id, UserId = userId, Status = "Approved" });
        await _db.SaveChangesAsync();
        
        return Ok(new { team.Id, team.Name });
    }
    
    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinTeamDto dto)
    {
        var userId = GetUserId();
        if (userId == 0) return Unauthorized();

        var team = await _db.Teams.Include(t => t.Hackathon).FirstOrDefaultAsync(t => t.Id == dto.TeamId);
        if (team == null) return NotFound();
        
        var already = await _db.TeamMembers
            .AnyAsync(tm => tm.UserId == userId && tm.Team.HackathonId == team.HackathonId);
        if (already)
            return BadRequest(new { message = "Заявка уже отправлена или вы уже в команде" });
        
        _db.TeamMembers.Add(new TeamMember { TeamId = dto.TeamId, UserId = userId, Status = "Pending" });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Заявка на вступление отправлена капитану" });
    }
    
    [HttpPost("{teamId}/approve/{userId}")]
    public async Task<IActionResult> Approve(int teamId, int userId)
    {
        var currentUserId = GetUserId();
        var team = await _db.Teams.FindAsync(teamId);
        if (team == null || team.CaptainId != currentUserId)
            return Forbid("Только капитан может одобрять заявки");
            
        var membership = await _db.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);
        if (membership == null) return NotFound();
        
        membership.Status = "Approved";
        await _db.SaveChangesAsync();
        return Ok(new { message = "Участник принят в команду" });
    }

    [HttpPost("{teamId}/reject/{userId}")]
    public async Task<IActionResult> Reject(int teamId, int userId)
    {
        var currentUserId = GetUserId();
        var team = await _db.Teams.FindAsync(teamId);
        if (team == null || team.CaptainId != currentUserId)
            return Forbid("Только капитан может отклонять заявки");
            
        var membership = await _db.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);
        if (membership == null) return NotFound();
        
        _db.TeamMembers.Remove(membership);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Заявка отклонена" });
    }
    
    [HttpPost("{teamId}/leave")]
    public async Task<IActionResult> Leave(int teamId)
    {
        var userId = GetUserId();
        var membership = await _db.TeamMembers.FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);
        if (membership == null) return NotFound();
        
        var team = await _db.Teams.FindAsync(teamId);
        if (team!.CaptainId == userId)
            return BadRequest(new { message = "Капитан не может покинуть команду" });
        
        _db.TeamMembers.Remove(membership);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Вы покинули команду" });
    }
}