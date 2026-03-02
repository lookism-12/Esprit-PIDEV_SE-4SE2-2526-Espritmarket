package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.service.marketplaceService.IShopService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ShopController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simplicity in unit tests
class ShopControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IShopService shopService;

    @Autowired
    private ObjectMapper objectMapper;

    private ShopResponseDTO shopResponseDTO;
    private ObjectId shopId;

    @BeforeEach
    void setUp() {
        shopId = new ObjectId();
        shopResponseDTO = new ShopResponseDTO();
        shopResponseDTO.setId(shopId.toHexString());
        shopResponseDTO.setName("Test Shop");
    }

    @Test
    @WithMockUser
    void getAll_ShouldReturnList() throws Exception {
        when(shopService.findAll()).thenReturn(Collections.singletonList(shopResponseDTO));

        mockMvc.perform(get("/api/shops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Shop"));
    }

    @Test
    @WithMockUser
    void getById_WhenExists_ShouldReturnShop() throws Exception {
        when(shopService.findById(shopId)).thenReturn(shopResponseDTO);

        mockMvc.perform(get("/api/shops/" + shopId.toHexString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(shopId.toHexString()));
    }

    @Test
    @WithMockUser
    void create_ShouldReturnCreatedShop() throws Exception {
        ShopRequestDTO requestDTO = new ShopRequestDTO();
        requestDTO.setName("New Shop");

        when(shopService.create(any(ShopRequestDTO.class))).thenReturn(shopResponseDTO);

        mockMvc.perform(post("/api/shops")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Shop"));
    }
}
