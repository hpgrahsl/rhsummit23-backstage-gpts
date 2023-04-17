package com.rhdevelopers.summit.workshop;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriBuilder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rhdevelopers.summit.workshop.BackendRegistry.Backend;
import com.rhdevelopers.summit.workshop.BackendRegistry.Coordinates;

@Path("fake/")
public class SummitBackendResource {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static final Backend SUMMIT_BACKEND_INFO = new Backend(
        "summit-backend",
        "Summit Backend",
        new Coordinates(0.0, 0.0),
        4
    );
    
    public static final List<PoiRecord> SUMMIT_POI_RECORDS = new ArrayList<>();

    @PostConstruct
    void initializePoiRecords() {
        SUMMIT_POI_RECORDS.add(new PoiRecord("Red Hat Headquarters", "Raleigh,NC,USA", List.of(35.787743, -78.644257)));
        SUMMIT_POI_RECORDS.add(new PoiRecord("Red Hat Summit","Bosten,MA,USA", List.of(42.361145, -71.057083)));
    }

    @GET
    @Path("ws/info")
    public Response getInfo() throws IOException {
        return Response.ok(
            OBJECT_MAPPER.writeValueAsString(SUMMIT_BACKEND_INFO),
            MediaType.APPLICATION_JSON
        ).build();
    }

    @GET
    @Path("poi/find/all")
    public Response getAllDataPoints() throws IOException {
        return Response.ok(
            OBJECT_MAPPER.writeValueAsString(SUMMIT_POI_RECORDS),
            MediaType.APPLICATION_JSON
        ).build();
    }

    @GET
    @Path("poi/find/{id}")
    public Response getOneDataPoint(@PathParam("id") int id) throws IOException {
        if(id < 0 || id >= SUMMIT_POI_RECORDS.size()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("no data point with id "+id+" found").build();
        }
        return Response.ok(
            OBJECT_MAPPER.writeValueAsString(SUMMIT_POI_RECORDS.get(id)),
            MediaType.APPLICATION_JSON
        ).build();
    }

    /*
    @POST
    @Path("poi/add/point")
    public Response loadCustomPoi(PoiRecord record) {
        SUMMIT_POI_RECORDS.add(record);
        return Response.created(
            UriBuilder.fromPath("fake/poi/find/"+(SUMMIT_POI_RECORDS.size()-1)).build()
        ).entity("inserted custom data point").build();
    }
    */

}
