package esprit_market.service.forumService;

import esprit_market.entity.forum.Post;

import java.util.List;

public interface IPostService {
    List<Post> findAll();
}
