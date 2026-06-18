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
public class SubmissionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    
    public SubmissionsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }
    
    private int GetUserId() 
    {
        var userIdStr = User.FindFirstValue("UserId");
        return int.TryParse(userIdStr, out int id) ? id : 0;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? hackathonId, [FromQuery] int? teamId)
    {
        var currentUserId = GetUserId();
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var query = _db.Submissions
            .Include(s => s.Team).ThenInclude(t => t.Hackathon)
            .Include(s => s.Team).ThenInclude(t => t.Members)
            .AsQueryable();
        
        if (hackathonId.HasValue) 
            query = query.Where(s => s.HackathonId == hackathonId.Value);
        if (teamId.HasValue) 
            query = query.Where(s => s.TeamId == teamId.Value);
        
        var subs = await query.ToListAsync();

        var visibleSubs = subs.Where(s => 
        {
            if (userRole == "Admin") return true;
            
            if (s.Team.Hackathon.OrganizerId == currentUserId) return true;
            
            if (currentUserId > 0)
            {
                return s.Team.Members.Any(m => m.UserId == currentUserId && m.Status == "Approved");
            }
            
            return false;
        }).ToList();

        var result = visibleSubs.Select(s => new SubmissionDto(
            s.Id, s.TeamId, s.Team.Name, s.HackathonId, s.Team.Hackathon.Title,
            s.FileName, s.Description, s.RepositoryUrl, s.SubmittedAt
        ));
        return Ok(result);
    }
    
    [HttpPost]
    public async Task<IActionResult> Submit(
        [FromForm] int teamId,
        [FromForm] int hackathonId,
        [FromForm] IFormFile file,
        [FromForm] string? description,
        [FromForm] string? repositoryUrl)
    {
        var userId = GetUserId();
        if (userId == 0) return Unauthorized(new { message = "Не удалось определить пользователя" });
        
        var isMember = await _db.TeamMembers.AnyAsync(tm => tm.TeamId == teamId && tm.UserId == userId && tm.Status == "Approved");
        if (!isMember)
            return BadRequest(new { message = "Вы не состоите в этой команде или ваша заявка еще не одобрена" });
        
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Файл обязателен" });
        
        var uploadsDir = Path.Combine(_env.ContentRootPath, "Uploads");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);
        
        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);
        
        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);
        
        var submission = new Submission
        {
            TeamId = teamId,
            HackathonId = hackathonId,
            FileName = file.FileName,
            FilePath = fileName,
            Description = description,
            RepositoryUrl = repositoryUrl
        };
        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();
        
        return Ok(new { submission.Id, submission.FileName, submission.SubmittedAt });
    }
    
    [HttpGet("download/{id}")]
    public async Task<IActionResult> Download(int id)
    {
        var currentUserId = GetUserId();
        var userRole = User.FindFirstValue(ClaimTypes.Role);

        var sub = await _db.Submissions
            .Include(s => s.Team).ThenInclude(t => t.Hackathon)
            .Include(s => s.Team).ThenInclude(t => t.Members)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        if (sub == null) return NotFound();

        bool canDownload = false;
        if (userRole == "Admin") canDownload = true;
        else if (sub.Team.Hackathon.OrganizerId == currentUserId) canDownload = true;
        else if (currentUserId > 0 && sub.Team.Members.Any(m => m.UserId == currentUserId && m.Status == "Approved")) canDownload = true;

        if (!canDownload) 
            return Forbid("У вас нет прав для скачивания этого решения");

        var path = Path.Combine(_env.ContentRootPath, "Uploads", sub.FilePath);
        if (!System.IO.File.Exists(path)) return NotFound();
        
        return PhysicalFile(path, "application/octet-stream", sub.FileName);
    }
}